import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = process.env.PORT || 10000;

try {
    await connectDatabase();

    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
} catch (err) {
    console.error(err);
}