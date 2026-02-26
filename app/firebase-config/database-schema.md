# Database Schema (Cloud Firestore)

This project uses a NoSQL document structure. Below are the primary collections and their data models.

### `products`
*Inventory items available for purchase.*
- `name`: string
- `category`: string
- `price`: number
- `stock`: number
- `requiresPrescription`: boolean

### `pharmacies`
*Physical locations and their associated inventory.*
- `name`: string
- `address`: string
- `latitude`: number
- `longitude`: number
- `productsId`: array (References to document IDs in `products`)

### `orders`
*Customer purchase history and status tracking.*
- `email`: string (User identifier)
- `total`: number
- `status`: string (e.g., "Pending", "Completed")
- `items`: array of objects
    - `productID`: string
    - `name`: string
    - `price`: number
    - `qty`: number

### `users`
*User profiles and permission levels.*
- `displayName`: string
- `email`: string
- `isAdmin`: boolean (Used for Role-Based Access Control)