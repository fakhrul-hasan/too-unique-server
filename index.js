const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xyrtm8p.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const toysCollection = client.db("tooUniqueDB").collection("toys");

    app.post("/addToy", async (req, res) => {
      const toy = req.body;
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    });
    app.get("/allToys", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 20;
      const skip = page * limit;
      let query = {};
      let sortOrder = 'asc'
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
        sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      }
      const cursor = toysCollection.find(query).skip(skip).limit(limit).sort({price: sortOrder});
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get('/allToys/:search', async(req,res)=>{
      const searchText = req.params.search;
      const results = await toysCollection.find({name: {$regex: searchText, $options: 'i'}}).toArray();
      res.send(results);
    })
    app.get("/totalToys", async (req, res) => {
      const result = await toysCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    });
    app.get("/toys/:text", async (req, res) => {
      if (req.params.text == 0) {
        const result = await toysCollection
          .find({ subCategoryName: "Electronics" })
          .toArray();
        return res.send(result);
      } else if (req.params.text == 1) {
        const result = await toysCollection
          .find({ subCategoryName: "Remote Control Vehicle" })
          .toArray();
        return res.send(result);
      } else if (req.params.text == 2) {
        const result = await toysCollection
          .find({ subCategoryName: "Monster Trucks" })
          .toArray();
        return res.send(result);
      }
    });
    app.get("/toyDetails/:id", async (req, res) => {
      const id = req.params.id;
      const result = await toysCollection
        .find({ _id: new ObjectId(id) })
        .toArray();
      res.send(result);
    });
    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = {upsert: true};
      const updatedToy = req.body;
      const toy = {
        $set: {
          picture: updatedToy.picture,
          name: updatedToy.name,
          sellerName: updatedToy.sellerName,
          sellerEmail: updatedToy.sellerEmail,
          subCategoryName: updatedToy.subCategoryName,
          price: parseInt(updatedToy.price),
          rating: updatedToy.rating,
          qty: updatedToy.qty,
          detail: updatedToy.detail,
        },
      };
      const result = await toysCollection.updateOne(filter, toy, options);
      res.send(result);
    });
    app.delete('/toy/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
