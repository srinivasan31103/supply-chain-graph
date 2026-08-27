require('dotenv').config();
const neo4j = require('neo4j-driver');

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error('Error: COGNODB_URI or COGNODB_PASSWORD is not defined in .env file.');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function seed() {
  console.log('Connecting to CognoDB Cloud...');
  const session = driver.session();
  try {
    // 1. Clean Database
    console.log('Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    // 2. Create Nodes & Relationships
    console.log('Seeding Supply Chain graph database...');
    
    // Create Suppliers
    const suppliers = [
      { name: 'Apex Semiconductor', country: 'Taiwan', riskRating: 0.15, category: 'Semiconductors' },
      { name: 'Lithium Chem Corp', country: 'South Korea', riskRating: 0.55, category: 'Chemicals & Mining' },
      { name: 'GlassCraft Inc', country: 'Japan', riskRating: 0.20, category: 'Optics' },
      { name: 'EcoBox Packaging', country: 'USA', riskRating: 0.10, category: 'Packaging' },
      { name: 'Nordic Mining Group', country: 'Norway', riskRating: 0.35, category: 'Chemicals & Mining' },
      { name: 'Sino Assembly Parts', country: 'China', riskRating: 0.70, category: 'Hardware' }
    ];

    for (const s of suppliers) {
      await session.run(
        `CREATE (s:Supplier {name: $name, country: $country, riskRating: $riskRating, category: $category})`,
        s
      );
    }
    console.log('Created Supplier nodes...');

    // Create Components
    const components = [
      { sku: 'COMP-M2', name: 'M2 Silicon Chip', category: 'Processor', cost: 45.00 },
      { sku: 'COMP-BAT5', name: '5000mAh Battery Cell', category: 'Power', cost: 18.00 },
      { sku: 'COMP-OLED', name: 'OLED Glass Panel', category: 'Display', cost: 35.00 },
      { sku: 'COMP-BOX', name: 'Recycled Gift Box', category: 'Packaging', cost: 3.00 },
      { sku: 'COMP-COB', name: 'Refined Cobalt Powder', category: 'Raw Materials', cost: 8.00 },
      { sku: 'COMP-COP', name: 'Copper Wire Mesh', category: 'Raw Materials', cost: 4.00 }
    ];

    for (const c of components) {
      await session.run(
        `CREATE (c:Component {sku: $sku, name: $name, category: $category, cost: $cost})`,
        c
      );
    }
    console.log('Created Component nodes...');

    // Create Products
    const products = [
      { sku: 'PROD-QP15', name: 'Quantum Phone 15', price: 899.00, description: 'Flagship smartphone with M2 processor and OLED display.' },
      { sku: 'PROD-STP', name: 'Spectra Tablet Pro', price: 1099.00, description: 'Pro-tier 12-inch tablet with dual M2 chips.' }
    ];

    for (const p of products) {
      await session.run(
        `CREATE (p:Product {sku: $sku, name: $name, price: $price, description: $description})`,
        p
      );
    }
    console.log('Created Product nodes...');

    // Create Facilities
    const facilities = [
      { name: 'Shenzhen Mega-Factory', type: 'Assembly Plant', location: 'China' },
      { name: 'Rotterdam Logistics Hub', type: 'Distribution Center', location: 'Netherlands' }
    ];

    for (const f of facilities) {
      await session.run(
        `CREATE (f:Facility {name: $name, type: $type, location: $location})`,
        f
      );
    }
    console.log('Created Facility nodes...');

    // Create Customer Orders
    const orders = [
      { id: 'ORD-101', customerName: 'TechRetail Corp', date: '2026-08-25', value: 44950.00, status: 'Pending' },
      { id: 'ORD-102', customerName: 'Apex Logistics', date: '2026-08-26', value: 10990.00, status: 'Processing' },
      { id: 'ORD-103', customerName: 'EuroDigital Shop', date: '2026-08-24', value: 89900.00, status: 'Shipped' }
    ];

    for (const o of orders) {
      await session.run(
        `CREATE (o:CustomerOrder {id: $id, customerName: $customerName, date: $date, value: $value, status: $status})`,
        o
      );
    }
    console.log('Created CustomerOrder nodes...');

    // 3. Create Relationships
    console.log('Linking nodes with relationships...');

    // SUPPLIES relationships (Supplier -> Component)
    const suppliesRel = [
      { supplier: 'Apex Semiconductor', component: 'COMP-M2' },
      { supplier: 'Lithium Chem Corp', component: 'COMP-BAT5' },
      { supplier: 'GlassCraft Inc', component: 'COMP-OLED' },
      { supplier: 'EcoBox Packaging', component: 'COMP-BOX' },
      { supplier: 'Nordic Mining Group', component: 'COMP-COB' },
      { supplier: 'Sino Assembly Parts', component: 'COMP-COP' },
      // Setup a backup/alternative supplier for test purposes
      { supplier: 'Lithium Chem Corp', component: 'COMP-COB' } // Lithium Chem also supplies Cobalt
    ];

    for (const rel of suppliesRel) {
      await session.run(`
        MATCH (s:Supplier {name: $supplier})
        MATCH (c:Component {sku: $component})
        MERGE (s)-[:SUPPLIES]->(c)
      `, rel);
    }

    // PART_OF relationships (Subcomponent -> Parent Component)
    const partOfRel = [
      { sub: 'COMP-COB', parent: 'COMP-BAT5' }, // Cobalt is part of Battery Cell
      { sub: 'COMP-COP', parent: 'COMP-M2' }    // Copper Mesh is part of M2 Processor
    ];

    for (const rel of partOfRel) {
      await session.run(`
        MATCH (sub:Component {sku: $sub})
        MATCH (parent:Component {sku: $parent})
        MERGE (sub)-[:PART_OF]->(parent)
      `, rel);
    }

    // USED_IN relationships (Component -> Product)
    const usedInRel = [
      { component: 'COMP-M2', product: 'PROD-QP15', quantity: 1 },
      { component: 'COMP-BAT5', product: 'PROD-QP15', quantity: 1 },
      { component: 'COMP-OLED', product: 'PROD-QP15', quantity: 1 },
      { component: 'COMP-BOX', product: 'PROD-QP15', quantity: 1 },
      { component: 'COMP-M2', product: 'PROD-STP', quantity: 2 }, // Tablet requires 2 M2 processors
      { component: 'COMP-BAT5', product: 'PROD-STP', quantity: 1 },
      { component: 'COMP-OLED', product: 'PROD-STP', quantity: 1 }
    ];

    for (const rel of usedInRel) {
      await session.run(`
        MATCH (c:Component {sku: $component})
        MATCH (p:Product {sku: $product})
        MERGE (c)-[:USED_IN {quantity: $quantity}]->(p)
      `, rel);
    }

    // MANUFACTURED_AT relationships (Product -> Facility)
    const mfgRel = [
      { product: 'PROD-QP15', facility: 'Shenzhen Mega-Factory' },
      { product: 'PROD-STP', facility: 'Shenzhen Mega-Factory' }
    ];

    for (const rel of mfgRel) {
      await session.run(`
        MATCH (p:Product {sku: $product})
        MATCH (f:Facility {name: $facility})
        MERGE (p)-[:MANUFACTURED_AT]->(f)
      `, rel);
    }

    // CONTAINED_IN relationships (Product -> CustomerOrder)
    const orderRel = [
      { product: 'PROD-QP15', order: 'ORD-101', quantity: 50 },
      { product: 'PROD-STP', order: 'ORD-102', quantity: 10 },
      { product: 'PROD-QP15', order: 'ORD-103', quantity: 100 }
    ];

    for (const rel of orderRel) {
      await session.run(`
        MATCH (p:Product {sku: $product})
        MATCH (o:CustomerOrder {id: $order})
        MERGE (p)-[:CONTAINED_IN {quantity: $quantity}]->(o)
      `, rel);
    }

    console.log('Relationships successfully established!');
    console.log('Database seeding completed successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
