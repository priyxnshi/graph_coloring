import pickle
import pandas as pd

# LOAD DATASET
df = pd.read_csv("cleaned_dataset.csv")

# LOAD GREEDY COLORING
with open("greedy_coloring.pkl", "rb") as f:
    coloring = pickle.load(f)

# GROUP FEATURES
color_groups = {}

for feature, color in coloring.items():

    if color not in color_groups:
        color_groups[color] = []

    color_groups[color].append(feature)

# SELECT BEST FEATURE
selected_features = []

print("\nGREEDY FEATURE SELECTION")

for color, features in color_groups.items():

    variances = df[features].var()

    best_feature = variances.idxmax()

    selected_features.append(best_feature)

    print(f"Color {color} ---> {best_feature}")

# REDUCED DATASET
reduced_df = df[selected_features]

# SAVE
reduced_df.to_csv(
    "greedy_selected_dataset.csv",
    index=False
)

print("\nOriginal Features:", df.shape[1])
print("Selected Features:", reduced_df.shape[1])

reduction = (
    (df.shape[1] - reduced_df.shape[1])
    / df.shape[1]
) * 100

print(f"Feature Reduction: {reduction:.2f}%")