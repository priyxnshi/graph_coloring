import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# STEP 1: Load Cleaned Dataset
df = pd.read_csv("cleaned_dataset.csv")

# STEP 2: Compute Correlation Matrix
correlation_matrix = df.corr()

# STEP 3: Save Correlation Matrix
correlation_matrix.to_csv("correlation_matrix.csv")

print("Correlation matrix saved as correlation_matrix.csv")

# STEP 4: Plot Heatmap
plt.figure(figsize=(14, 12))

sns.heatmap(correlation_matrix, cmap="coolwarm")

plt.title("Feature Correlation Matrix")

# Save figure
plt.savefig("correlation_heatmap.png")

plt.show()

print("Heatmap saved as correlation_heatmap.png")