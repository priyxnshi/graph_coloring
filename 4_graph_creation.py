import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
import pickle

# STEP 1: Load Conflict Pairs
conflict_df = pd.read_csv("conflict_pairs.csv")

# STEP 2: Create Graph
G = nx.Graph()

# Load cleaned dataset
dataset = pd.read_csv("cleaned_dataset.csv")

# Add ALL features as nodes
G.add_nodes_from(dataset.columns)

# STEP 3: Add Edges
for index, row in conflict_df.iterrows():

    feature1 = row["Feature1"]
    feature2 = row["Feature2"]

    G.add_edge(feature1, feature2)

# STEP 4: Print Graph Information
print("Graph Created Successfully")

print("\nNumber of Nodes:", G.number_of_nodes())
print("Number of Edges:", G.number_of_edges())

# STEP 5: Draw Graph
plt.figure(figsize=(16, 12))

pos = nx.spring_layout(G, seed=42)

nx.draw(
    G,
    pos,
    with_labels=True,
    node_size=700,
    font_size=8
)

plt.title("Feature Conflict Graph")

# Save graph image
plt.savefig("graph_visualization.png")

plt.show()

# STEP 6: Save Graph Object
with open("feature_graph.pkl", "wb") as f:
    pickle.dump(G, f)

print("\nGraph saved as feature_graph.pkl")
print("Graph visualization saved as graph_visualization.png")