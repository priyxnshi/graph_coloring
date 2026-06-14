import os
import time

start = time.time()

print("=" * 70)
print("CONFLICT-FREE FEATURE SELECTION PIPELINE")
print("=" * 70)

# =====================================================
# PREPROCESSING
# =====================================================

print("\n[1/11] Running Data Preprocessing...")
os.system("python 1_data_preprocessing.py")

# =====================================================
# CORRELATION ANALYSIS
# =====================================================

print("\n[2/11] Running Correlation Analysis...")
os.system("python 2_correlation_analysis.py")

# =====================================================
# CONFLICT EXTRACTION
# =====================================================

print("\n[3/11] Running Conflict Extraction...")
os.system("python 3_conflict_extraction.py")

# =====================================================
# GRAPH CREATION
# =====================================================

print("\n[4/11] Running Graph Creation...")
os.system("python 4_graph_creation.py")

# =====================================================
# GREEDY COLORING
# =====================================================

print("\n[5/11] Running Greedy Graph Coloring...")
os.system("python 5_greedy_graph_coloring.py")

# =====================================================
# BACKTRACKING COLORING
# =====================================================

print("\n[6/11] Running Backtracking Graph Coloring...")
os.system("python 6_backtracking_graph_coloring.py")

# =====================================================
# GREEDY FEATURE SELECTION
# =====================================================

print("\n[7/11] Running Greedy Feature Selection...")
os.system("python 7_feature_selection_greedy.py")

# =====================================================
# BACKTRACKING FEATURE SELECTION
# =====================================================

print("\n[8/11] Running Backtracking Feature Selection...")
os.system("python 8_feature_selection_backtracking.py")

# =====================================================
# ML EVALUATION
# =====================================================

print("\n[9/11] Running ML Training & Evaluation...")
os.system("python 9_ml_training_and_evaluation.py")

# =====================================================
# VISUALIZATION DASHBOARD
# =====================================================

print("\n[10/11] Generating Visualization Dashboard...")
os.system("python 10_visualization_dashboard.py")

# =====================================================
# PERFORMANCE ANALYSIS
# =====================================================

print("\n[11/11] Running Performance Analysis...")
os.system("python 11_performance_analysis.py")

end = time.time()

print("\n" + "=" * 70)
print("PROJECT EXECUTED SUCCESSFULLY")
print("=" * 70)

print(f"\nTotal Execution Time: {end - start:.2f} seconds")