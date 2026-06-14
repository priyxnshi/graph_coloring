
import pickle
import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

# =====================================================
# LOAD GRAPH
# =====================================================

with open("feature_graph.pkl", "rb") as f:
    G = pickle.load(f)

# =====================================================
# LOAD CORRELATION MATRIX
# =====================================================

corr_matrix = pd.read_csv(
    "correlation_matrix.csv",
    index_col=0
)

# =====================================================
# APPLY GRAPH COLORING
# =====================================================

coloring = nx.coloring.greedy_color(
    G,
    strategy="largest_first"
)

# =====================================================
# CREATE NODE COLORS
# =====================================================

unique_colors = list(set(coloring.values()))

# COLORMAP
cmap = plt.cm.get_cmap("tab20", len(unique_colors))

node_colors = [
    cmap(coloring[node])
    for node in G.nodes()
]

# =====================================================
# CREATE EDGE WEIGHTS
# =====================================================

edge_weights = []
edge_labels = {}

for u, v in G.edges():

    corr_value = abs(corr_matrix.loc[u, v])

    # STORE LABEL
    edge_labels[(u, v)] = round(corr_value, 2)

    # THICKER EDGE FOR HIGHER CORRELATION
    edge_weights.append(corr_value * 5)

# =====================================================
# DRAW GRAPH
# =====================================================

plt.figure(figsize=(22, 18))

# LAYOUT
pos = nx.spring_layout(
    G,
    k=1.2,
    seed=42
)

# DRAW NODES
nx.draw_networkx_nodes(
    G,
    pos,
    node_color=node_colors,
    node_size=2500,
    alpha=0.95
)

# DRAW EDGES
nx.draw_networkx_edges(
    G,
    pos,
    width=edge_weights,
    alpha=0.6,
    edge_color="gray"
)

# DRAW LABELS
nx.draw_networkx_labels(
    G,
    pos,
    font_size=9,
    font_weight="bold"
)

# DRAW EDGE LABELS
nx.draw_networkx_edge_labels(
    G,
    pos,
    edge_labels=edge_labels,
    font_size=7
)

# =====================================================
# CREATE LEGEND
# =====================================================

legend_elements = []

for color in unique_colors:

    legend_elements.append(
        Line2D(
            [0],
            [0],
            marker='o',
            color='w',
            label=f'Color Group {color}',
            markerfacecolor=cmap(color),
            markersize=12
        )
    )

plt.legend(
    handles=legend_elements,
    loc='upper right'
)

# =====================================================
# TITLE
# =====================================================

plt.title(
    "Advanced Weighted Conflict Graph with Graph Coloring",
    fontsize=22,
    fontweight='bold'
)

# REMOVE AXES
plt.axis('off')

# =====================================================
# SAVE GRAPH
# =====================================================

plt.savefig(
    "advanced_colored_conflict_graph.png",
    dpi=300,
    bbox_inches='tight'
)

plt.show()

# =====================================================
# PRINT SUMMARY
# =====================================================

print("=" * 70)
print("ADVANCED GRAPH VISUALIZATION GENERATED")
print("=" * 70)

print(f"\nNumber of Nodes: {G.number_of_nodes()}")
print(f"Number of Edges: {G.number_of_edges()}")

print(
    f"Unique Color Groups: {len(unique_colors)}"
)

print(
    "\nVisualization saved as: advanced_colored_conflict_graph.png"
)