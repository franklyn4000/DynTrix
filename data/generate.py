
import networkx as nx
import json


S =   nx.chordal_cycle_graph(20, create_using=None)

M =  nx.duplication_divergence_graph(120, 0.4, seed=None)

L =  nx.barabasi_albert_graph(500, 1, seed=None, initial_graph=nx.barabasi_albert_graph(100, 2, seed=None, initial_graph=nx.watts_strogatz_graph(40, 2, 0.22)))

L = nx.duplication_divergence_graph(15000, 0.2, seed=None)

#G = nx.random_lobster(100, 0.8, 0.4)


data_small = nx.node_link_data(S)
data_medium = nx.node_link_data(M)
data_large = nx.node_link_data(L)

with open("generated_small.json", "w") as outfile:
    json.dump(data_small, outfile)
with open("generated_medium.json", "w") as outfile:
    json.dump(data_medium, outfile)
with open("generated_large.json", "w") as outfile:
    json.dump(data_large, outfile)
