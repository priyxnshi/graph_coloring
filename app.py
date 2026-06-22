import os
import time
import pickle
import pandas as pd
import numpy as np
import networkx as nx
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

from sklearn.datasets import load_breast_cancer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# Ensure folders exist
os.makedirs('templates', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)

# Helper variables to track active dataset state
ACTIVE_DATASET_PATH = "cleaned_dataset.csv"
ORIGINAL_DATASET_PATH = "original_dataset.csv"

import json

# Global dictionary to keep target 'y' values in memory
state = {
    "y": None,
    "feature_names": [],
    "target_name": "target"
}

def save_state():
    with open("state.json", "w") as f:
        json.dump(state, f)

def load_state():
    global state
    if os.path.exists("state.json"):
        with open("state.json", "r") as f:
            state.update(json.load(f))

def load_default_breast_cancer():
    data = load_breast_cancer()
    df_orig = pd.DataFrame(data.data, columns=data.feature_names)
    # Save original
    df_orig_copy = df_orig.copy()
    df_orig_copy['target'] = data.target
    df_orig_copy.to_csv(ORIGINAL_DATASET_PATH, index=False)
    
    # Preprocess
    df_clean = df_orig.fillna(df_orig.mean())
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df_clean)
    df_scaled = pd.DataFrame(scaled_data, columns=df_clean.columns)
    df_scaled.to_csv("cleaned_dataset.csv", index=False)
    
    state["y"] = data.target.tolist()
    state["feature_names"] = list(df_clean.columns)
    state["target_name"] = "target"
    
    # Calculate null counts in original
    null_counts = int(df_orig.isnull().sum().sum())
    
    save_state()
    
    return {
        "samples": int(df_clean.shape[0]),
        "features": int(df_clean.shape[1]),
        "missing_values": null_counts,
        "feature_list": list(df_clean.columns)
    }

def process_custom_csv(filepath):
    df_orig = pd.read_csv(filepath)
    
    # Identify target column: Look for target, class, label, diagnosis, y, or use last column
    target_col = None
    for col in df_orig.columns:
        if col.lower() in ['target', 'class', 'label', 'diagnosis', 'y', 'outcome', 'species']:
            target_col = col
            break
    if target_col is None:
        target_col = df_orig.columns[-1]
    
    y = df_orig[target_col].values
    X_df = df_orig.drop(columns=[target_col])
    
    # Preprocess feature columns (keep numeric only)
    X_df = X_df.select_dtypes(include=[np.number])
    
    # Fill missing values
    missing_count = int(X_df.isnull().sum().sum())
    X_df = X_df.fillna(X_df.mean())
    
    # Normalize data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(X_df)
    df_scaled = pd.DataFrame(scaled_data, columns=X_df.columns)
    
    # Save files to maintain pipeline compatibility
    df_scaled.to_csv("cleaned_dataset.csv", index=False)
    df_orig.to_csv(ORIGINAL_DATASET_PATH, index=False)
    
    # Update state
    state["y"] = y.tolist()
    state["feature_names"] = list(X_df.columns)
    state["target_name"] = target_col
    
    save_state()
    
    return {
        "samples": int(X_df.shape[0]),
        "features": int(X_df.shape[1]),
        "missing_values": missing_count,
        "feature_list": list(X_df.columns)
    }

# Route to serve the SPA frontend
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/load-default', methods=['POST'])
def api_load_default():
    try:
        stats = load_default_breast_cancer()
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/upload-csv', methods=['POST'])
def api_upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No selected file"}), 400
        
        filepath = "uploaded_temp.csv"
        file.save(filepath)
        stats = process_custom_csv(filepath)
        return jsonify({"success": True, "stats": stats})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/run-pipeline', methods=['POST'])
def api_run_pipeline():
    try:
        load_state()
        data = request.get_json() or {}
        threshold = float(data.get('threshold', 0.8))
        
        # Ensure we have active data loaded, otherwise default to breast cancer
        if not os.path.exists("cleaned_dataset.csv") or state.get("y") is None:
            load_default_breast_cancer()
            
        df = pd.read_csv("cleaned_dataset.csv")
        y = np.array(state["y"])
        features = list(df.columns)
        
        # 1. Compute Correlation Matrix
        correlation_matrix = df.corr()
        correlation_matrix.to_csv("correlation_matrix.csv")
        
        # 2. Extract Conflict Pairs
        conflicts = []
        strongest_corr = 0.0
        strongest_pair = None
        
        for i in range(len(features)):
            for j in range(i + 1, len(features)):
                corr_val = correlation_matrix.iloc[i, j]
                abs_corr = abs(corr_val)
                
                # Check strongest correlation (excluding identity)
                if abs_corr > strongest_corr:
                    strongest_corr = abs_corr
                    strongest_pair = {
                        "feature1": features[i],
                        "feature2": features[j],
                        "correlation": float(corr_val)
                    }
                
                if abs_corr > threshold:
                    conflicts.append({
                        "feature1": features[i],
                        "feature2": features[j],
                        "correlation": float(corr_val)
                    })
                    
        # Save conflict pairs to file
        conflict_df = pd.DataFrame(conflicts)
        if conflict_df.empty:
            conflict_df = pd.DataFrame(columns=["Feature1", "Feature2", "Correlation"])
        else:
            conflict_df.columns = ["Feature1", "Feature2", "Correlation"]
        conflict_df.to_csv("conflict_pairs.csv", index=False)
        
        # 3. Create NetworkX Graph
        G = nx.Graph()
        G.add_nodes_from(features)
        for c in conflicts:
            G.add_edge(c["feature1"], c["feature2"])
            
        with open("feature_graph.pkl", "wb") as f:
            pickle.dump(G, f)
            
        graph_stats = {
            "nodes": int(G.number_of_nodes()),
            "edges": int(G.number_of_edges()),
            "density": float(nx.density(G))
        }
        
        # 4. Greedy Coloring
        t0 = time.time()
        greedy_coloring = nx.coloring.greedy_color(G, strategy="largest_first")
        greedy_time = time.time() - t0
        
        # Save greedy coloring
        with open("greedy_coloring.pkl", "wb") as f:
            pickle.dump(greedy_coloring, f)
        
        # 5. Backtracking Coloring (optimized)
        t0 = time.time()
        # To make it fast and guaranteed to find minimum coloring, search up to greedy's limit
        greedy_colors_count = max(greedy_coloring.values()) + 1 if greedy_coloring else 0
        backtracking_coloring = {}
        backtracking_colors_count = 0
        
        nodes_sorted = sorted(list(G.nodes()), key=lambda n: G.degree(n), reverse=True)
        
        def is_safe(node, color, current_coloring):
            for neighbor in G.neighbors(node):
                if neighbor in current_coloring and current_coloring[neighbor] == color:
                    return False
            return True
            
        def solve_backtracking(index, color_limit, current_coloring):
            if index == len(nodes_sorted):
                return True
            node = nodes_sorted[index]
            for color in range(color_limit):
                if is_safe(node, color, current_coloring):
                    current_coloring[node] = color
                    if solve_backtracking(index + 1, color_limit, current_coloring):
                        return True
                    del current_coloring[node]
            return False
            
        # Search for minimum number of colors
        for limit in range(1, greedy_colors_count + 1):
            temp_coloring = {}
            if solve_backtracking(0, limit, temp_coloring):
                backtracking_coloring = temp_coloring
                backtracking_colors_count = limit
                break
        
        if not backtracking_coloring:
            backtracking_coloring = greedy_coloring.copy()
            backtracking_colors_count = greedy_colors_count
            
        backtracking_time = time.time() - t0
        
        # Save backtracking coloring
        with open("backtracking_coloring.pkl", "wb") as f:
            pickle.dump(backtracking_coloring, f)
            
        # 6. Feature Selection
        # Greedy
        greedy_color_groups = {}
        for feat, col_idx in greedy_coloring.items():
            greedy_color_groups.setdefault(col_idx, []).append(feat)
            
        greedy_selected = []
        greedy_feature_details = [] # details for card display
        for col_idx, feats in greedy_color_groups.items():
            variances = df[feats].var()
            best_feat = variances.idxmax()
            greedy_selected.append(best_feat)
            greedy_feature_details.append({
                "color": int(col_idx),
                "features": feats,
                "selected": best_feat,
                "variances": {f: float(variances[f]) for f in feats}
            })
            
        # Backtracking
        backtracking_color_groups = {}
        for feat, col_idx in backtracking_coloring.items():
            backtracking_color_groups.setdefault(col_idx, []).append(feat)
            
        backtracking_selected = []
        backtracking_feature_details = []
        for col_idx, feats in backtracking_color_groups.items():
            variances = df[feats].var()
            best_feat = variances.idxmax()
            backtracking_selected.append(best_feat)
            backtracking_feature_details.append({
                "color": int(col_idx),
                "features": feats,
                "selected": best_feat,
                "variances": {f: float(variances[f]) for f in feats}
            })
            
        # Save selected datasets
        df[greedy_selected].to_csv("greedy_selected_dataset.csv", index=False)
        df[backtracking_selected].to_csv("backtracking_selected_dataset.csv", index=False)
        
        # 7. Machine Learning Training & Evaluation
        datasets = {
            "Original": df,
            "Greedy": df[greedy_selected],
            "Backtracking": df[backtracking_selected]
        }
        
        models = {
            "Logistic Regression": LogisticRegression(max_iter=10000),
            "Random Forest": RandomForestClassifier(random_state=42),
            "SVM": SVC(),
            "KNN": KNeighborsClassifier()
        }
        
        ml_results = []
        
        for ds_name, X_data in datasets.items():
            X_train, X_test, y_train, y_test = train_test_split(
                X_data, y, test_size=0.2, random_state=42
            )
            for model_name, model in models.items():
                start_time_model = time.time()
                model.fit(X_train, y_train)
                train_time = time.time() - start_time_model
                
                preds = model.predict(X_test)
                acc = accuracy_score(y_test, preds)
                prec = precision_score(y_test, preds, zero_division=0, average='weighted')
                rec = recall_score(y_test, preds, zero_division=0, average='weighted')
                f1 = f1_score(y_test, preds, zero_division=0, average='weighted')
                
                ml_results.append({
                    "Dataset": ds_name,
                    "Model": model_name,
                    "FeaturesCount": int(X_data.shape[1]),
                    "Accuracy": float(acc),
                    "Precision": float(prec),
                    "Recall": float(rec),
                    "F1Score": float(f1),
                    "TrainingTime": float(train_time)
                })
                
        # Save evaluation results CSV
        eval_df = pd.DataFrame(ml_results)
        eval_df.to_csv("evaluation_results.csv", index=False)
        
        # Format correlation matrix for heatmap rendering in ApexCharts
        # ApexCharts heatmap expects a series list of format { name: col_name, data: [ {x: col_name, y: val}, ... ] }
        heatmap_data = []
        corr_cols = list(correlation_matrix.columns)
        for i, col_name in enumerate(corr_cols):
            data_points = []
            for j, other_col in enumerate(corr_cols):
                data_points.append({
                    "x": other_col,
                    "y": round(float(correlation_matrix.iloc[i, j]), 3)
                })
            heatmap_data.append({
                "name": col_name,
                "data": data_points
            })
            
        # Format network graph elements for Vis.js
        # Node sizes based on degree, color based on algorithms (will paint dynamically on client)
        network_nodes = []
        for node in G.nodes():
            degree = G.degree(node)
            network_nodes.append({
                "id": node,
                "label": node,
                "degree": int(degree),
                "greedy_color": int(greedy_coloring.get(node, 0)),
                "backtracking_color": int(backtracking_coloring.get(node, 0))
            })
            
        network_edges = []
        for u, v in G.edges():
            corr_val = float(correlation_matrix.loc[u, v])
            network_edges.append({
                "from": u,
                "to": v,
                "correlation": corr_val,
                "value": abs(corr_val)
            })
            
        # Final response
        payload = {
            "success": True,
            "threshold": threshold,
            "stats": {
                "samples": int(df.shape[0]),
                "original_features": int(df.shape[1]),
            },
            "correlation": {
                "columns": corr_cols,
                "heatmap_data": heatmap_data,
                "conflict_count": len(conflicts),
                "conflicts": conflicts[:100],  # Return up to 100 for a table preview
                "strongest_pair": strongest_pair
            },
            "graph": {
                "stats": graph_stats,
                "nodes": network_nodes,
                "edges": network_edges
            },
            "algorithms": {
                "greedy": {
                    "colors_used": int(greedy_colors_count),
                    "execution_time": float(greedy_time),
                    "selected_features": greedy_selected,
                    "details": greedy_feature_details,
                    "complexity": "O(V + E) - Welsh-Powell heuristic ordering"
                },
                "backtracking": {
                    "colors_used": int(backtracking_colors_count),
                    "execution_time": float(backtracking_time),
                    "selected_features": backtracking_selected,
                    "details": backtracking_feature_details,
                    "complexity": "O(m^V) - Exact search with degree-ordering heuristics"
                }
            },
            "evaluation": ml_results
        }
        
        return jsonify(payload)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
