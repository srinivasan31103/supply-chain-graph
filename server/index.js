require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDriver, verifyConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to parse Neo4j node
function parseNode(node) {
  if (!node) return null;
  const id = node.elementId || (node.identity && (typeof node.identity.toString === 'function' ? node.identity.toString() : node.identity.low)) || String(Math.random());
  return {
    id,
    label: node.labels[0] || 'Unknown',
    properties: node.properties,
    displayName: node.properties.name || node.properties.sku || node.properties.id || id
  };
}

// Helper to parse Neo4j relationship
function parseRelationship(rel) {
  if (!rel) return null;
  const id = rel.elementId || (rel.identity && (typeof rel.identity.toString === 'function' ? rel.identity.toString() : rel.identity.low)) || String(Math.random());
  const from = rel.startNodeElementId || (rel.start && (typeof rel.start.toString === 'function' ? rel.start.toString() : rel.start.low));
  const to = rel.endNodeElementId || (rel.end && (typeof rel.end.toString === 'function' ? rel.end.toString() : rel.end.low));
  return {
    id,
    type: rel.type,
    from,
    to,
    properties: rel.properties
  };
}

// 1. Connection Status API
app.get('/api/status', async (req, res) => {
  try {
    await verifyConnection();
    res.json({ status: 'connected', uri: process.env.COGNODB_URI });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(503).json({ 
      status: 'disconnected', 
      error: 'CognoDB instance is unreachable. Please check your network or .env credentials.' 
    });
  }
});

// 2. Full Graph Data API
app.get('/api/graph', async (req, res) => {
  let session;
  try {
    const driver = getDriver();
    session = driver.session();

    // Query all nodes and relationships
    const nodesResult = await session.run('MATCH (n) RETURN n');
    const relsResult = await session.run('MATCH ()-[r]->() RETURN r');

    const nodesMap = new Map();
    const edgesMap = new Map();

    nodesResult.records.forEach(record => {
      const node = parseNode(record.get('n'));
      if (node) nodesMap.set(node.id, node);
    });

    relsResult.records.forEach(record => {
      const edge = parseRelationship(record.get('r'));
      if (edge) edgesMap.set(edge.id, edge);
    });

    res.json({
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values())
    });
  } catch (error) {
    console.error('Error fetching graph:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (session) await session.close();
  }
});

// 3. Cascading Risk Simulator API
// Finds all downstream paths originating from a selected supplier
app.get('/api/risk-cascade', async (req, res) => {
  const { supplierName } = req.query;
  if (!supplierName) {
    return res.status(400).json({ error: 'supplierName query parameter is required' });
  }

  let session;
  try {
    const driver = getDriver();
    session = driver.session();

    // Query paths from the selected supplier downstream
    const result = await session.run(
      `MATCH (s:Supplier {name: $supplierName})
       OPTIONAL MATCH path = (s)-[:SUPPLIES|PART_OF|USED_IN|MANUFACTURED_AT|CONTAINED_IN*1..5]->(downstream)
       RETURN path, s`,
      { supplierName }
    );

    const affectedNodeIds = new Set();
    const affectedEdgeIds = new Set();
    
    // Add the source supplier itself
    if (result.records.length > 0 && result.records[0].get('s')) {
      const sourceNode = parseNode(result.records[0].get('s'));
      if (sourceNode) affectedNodeIds.add(sourceNode.id);
    }

    result.records.forEach(record => {
      const path = record.get('path');
      if (path) {
        // Parse segments of the path
        path.segments.forEach(segment => {
          const start = parseNode(segment.start);
          const end = parseNode(segment.end);
          const rel = parseRelationship(segment.relationship);

          if (start) affectedNodeIds.add(start.id);
          if (end) affectedNodeIds.add(end.id);
          if (rel) affectedEdgeIds.add(rel.id);
        });
      }
    });

    res.json({
      affectedNodes: Array.from(affectedNodeIds),
      affectedEdges: Array.from(affectedEdgeIds)
    });
  } catch (error) {
    console.error('Error calculating risk cascade:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (session) await session.close();
  }
});

// 4. Order Lineage/Trace API
// Finds the complete supply chain path backing a specific CustomerOrder
app.get('/api/order-trace', async (req, res) => {
  const { orderId } = req.query;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId query parameter is required' });
  }

  let session;
  try {
    const driver = getDriver();
    session = driver.session();

    const result = await session.run(
      `MATCH path = (o:CustomerOrder {id: $orderId})<-[:CONTAINED_IN]-(p:Product)
       OPTIONAL MATCH compPath = (p)<-[:USED_IN]-(c:Component)
       OPTIONAL MATCH subPath = (c)<-[:PART_OF*0..3]-(sub:Component)
       OPTIONAL MATCH supPath = (sub)<-[:SUPPLIES]-(s:Supplier)
       RETURN path, compPath, subPath, supPath`,
      { orderId }
    );

    const nodesMap = new Map();
    const edgesMap = new Map();

    const addPathToGraphs = (pathObj) => {
      if (!pathObj) return;
      pathObj.segments.forEach(segment => {
        const start = parseNode(segment.start);
        const end = parseNode(segment.end);
        const rel = parseRelationship(segment.relationship);

        if (start) nodesMap.set(start.id, start);
        if (end) nodesMap.set(end.id, end);
        if (rel) edgesMap.set(rel.id, rel);
      });
    };

    result.records.forEach(record => {
      addPathToGraphs(record.get('path'));
      addPathToGraphs(record.get('compPath'));
      addPathToGraphs(record.get('subPath'));
      addPathToGraphs(record.get('supPath'));
    });

    res.json({
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values())
    });
  } catch (error) {
    console.error('Error fetching order trace:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (session) await session.close();
  }
});

// 5. Alternatives API
// Finds alternate suppliers who supply the same components as the selected supplier
app.get('/api/alternatives', async (req, res) => {
  const { supplierName } = req.query;
  if (!supplierName) {
    return res.status(400).json({ error: 'supplierName query parameter is required' });
  }

  let session;
  try {
    const driver = getDriver();
    session = driver.session();

    const result = await session.run(
      `MATCH (s:Supplier {name: $supplierName})-[:SUPPLIES]->(c:Component)<-[:SUPPLIES]-(alt:Supplier)
       WHERE s <> alt
       RETURN alt.name AS alternativeSupplier, c.name AS componentName, alt.riskRating AS alternativeRisk, alt.country AS alternativeCountry`,
      { supplierName }
    );

    const alternatives = result.records.map(record => ({
      alternativeSupplier: record.get('alternativeSupplier'),
      componentName: record.get('componentName'),
      alternativeRisk: record.get('alternativeRisk'),
      alternativeCountry: record.get('alternativeCountry')
    }));

    res.json(alternatives);
  } catch (error) {
    console.error('Error fetching alternatives:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (session) await session.close();
  }
});

// Serve frontend build static files in production
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
