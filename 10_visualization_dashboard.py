import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# LOAD RESULTS
results_df = pd.read_csv("evaluation_results.csv")

# STYLE
sns.set(style="whitegrid")

# =====================================================
# ACCURACY COMPARISON
# =====================================================

plt.figure(figsize=(14, 7))

sns.barplot(
    data=results_df,
    x="Model",
    y="Accuracy",
    hue="Dataset"
)

plt.title(
    "Accuracy Comparison Across Datasets",
    fontsize=16
)

plt.ylim(0.8, 1.0)

plt.savefig(
    "accuracy_comparison.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# F1 SCORE COMPARISON
# =====================================================

plt.figure(figsize=(14, 7))

sns.barplot(
    data=results_df,
    x="Model",
    y="F1 Score",
    hue="Dataset"
)

plt.title(
    "F1 Score Comparison",
    fontsize=16
)

plt.savefig(
    "f1_score_comparison.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# TRAINING TIME COMPARISON
# =====================================================

plt.figure(figsize=(14, 7))

sns.barplot(
    data=results_df,
    x="Model",
    y="Training Time",
    hue="Dataset"
)

plt.title(
    "Training Time Comparison",
    fontsize=16
)

plt.savefig(
    "training_time_comparison.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# FEATURE REDUCTION PLOT
# =====================================================

feature_counts = {
    "Original": 30,
    "Greedy": pd.read_csv(
        "greedy_selected_dataset.csv"
    ).shape[1],
    "Backtracking": pd.read_csv(
        "backtracking_selected_dataset.csv"
    ).shape[1]
}

plt.figure(figsize=(8, 6))

plt.bar(
    feature_counts.keys(),
    feature_counts.values()
)

plt.title("Feature Reduction Comparison")

plt.ylabel("Number of Features")

plt.savefig(
    "feature_reduction.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

print("Visualization Dashboard Created Successfully.")