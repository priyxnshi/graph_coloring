import pandas as pd
import time

from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

# LOAD DATA
data = load_breast_cancer()

X_original = pd.DataFrame(
    data.data,
    columns=data.feature_names
)

y = data.target

# LOAD REDUCED DATASETS
X_greedy = pd.read_csv(
    "greedy_selected_dataset.csv"
)

X_backtracking = pd.read_csv(
    "backtracking_selected_dataset.csv"
)

datasets = {
    "Original": X_original,
    "Greedy": X_greedy,
    "Backtracking": X_backtracking
}

# MODELS
models = {
    "Logistic Regression":
        LogisticRegression(max_iter=10000),

    "Random Forest":
        RandomForestClassifier(),

    "SVM":
        SVC(),

    "KNN":
        KNeighborsClassifier()
}

results = []

print("=" * 70)
print("ML MODEL TRAINING & EVALUATION")
print("=" * 70)

# TRAINING LOOP
for dataset_name, X in datasets.items():

    print(f"\n\nDATASET: {dataset_name}")
    print("-" * 50)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    for model_name, model in models.items():

        start_time = time.time()

        model.fit(X_train, y_train)

        training_time = time.time() - start_time

        predictions = model.predict(X_test)

        accuracy = accuracy_score(
            y_test,
            predictions
        )

        precision = precision_score(
            y_test,
            predictions
        )

        recall = recall_score(
            y_test,
            predictions
        )

        f1 = f1_score(
            y_test,
            predictions
        )

        results.append([
            dataset_name,
            model_name,
            X.shape[1],
            accuracy,
            precision,
            recall,
            f1,
            training_time
        ])

        print(f"\nModel: {model_name}")

        print(f"Features Used: {X.shape[1]}")

        print(f"Accuracy: {accuracy:.4f}")

        print(f"Precision: {precision:.4f}")

        print(f"Recall: {recall:.4f}")

        print(f"F1 Score: {f1:.4f}")

        print(f"Training Time: {training_time:.6f} sec")

# SAVE RESULTS
results_df = pd.DataFrame(
    results,
    columns=[
        "Dataset",
        "Model",
        "Features",
        "Accuracy",
        "Precision",
        "Recall",
        "F1 Score",
        "Training Time"
    ]
)

results_df.to_csv(
    "evaluation_results.csv",
    index=False
)

print("\nEvaluation Results Saved.")