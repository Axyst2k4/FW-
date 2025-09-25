/// Mock cluster
/// A Cluster is a group of stations nodes that are connected to each other
/// each Station will have a nodeId
/// each Station will have a list of child sensor nodes
/// each Sensor node will have a nodeId

export const ClusterData = {
  clusterId: "cluster1",
  clusterName: "Cluster 1",
  clusterDescription: "This is a cluster of stations",
  clusterNodes: [
    {
      nodeId: "station1",
      nodeName: "Station 1",
      nodeDescription: "This is station 1",
      nodeType: "station",
      nodeChildren: [
        {
          nodeId: "sensor1",
          nodeName: "Sensor 1",
          nodeDescription: "This is sensor 1",
          nodeType: "sensor",
          status: 1,
        },
        {
          nodeId: "sensor2",
          nodeName: "Sensor 2",
          nodeDescription: "This is sensor 2",
          nodeType: "sensor",
          status: 1,
        },
      ],
    },
    {
      nodeId: "station2",
      nodeName: "Station 2",
      nodeDescription: "This is station 2",
      nodeType: "station",
      nodeChildren: [
        {
          nodeId: "sensor3",
          nodeName: "Sensor 3",
          nodeDescription: "This is sensor 3",
          nodeType: "sensor",
          status: 1,
        },
        {
          nodeId: "sensor4",
          nodeName: "Sensor 4",
          nodeDescription: "This is sensor 4",
          nodeType: "sensor",
          status: 0,
        },
      ],
    },
  ],
};
