# MongoDB Atlas Migration Guide

## ✅ Migration Completed

Your Gym Management System has been successfully configured to use **MongoDB Atlas** cloud database.

### 📊 Atlas Cluster Details
- **Cluster**: gymmanagement.gzqjhpb.mongodb.net
- **Database**: gym_management
- **User**: dionedaeliseo_db_user

### 🔧 Files Updated
1. ✅ `appsettings.json` - Updated to use Atlas connection
2. ✅ `CreateAdminTool.cs` - Updated admin tool to use Atlas
3. ✅ `.env.example` - Added Atlas connection example
4. ✅ `appsettings.Production.json` - Created production config

### 🚀 How to Run

Simply run your application as before:
```powershell
cd GymManagementAPI
dotnet run
```

The application will now connect to MongoDB Atlas instead of localhost!

### 📝 Creating Your First Admin User

After running the application, create an admin user using:
```powershell
dotnet run --project GymManagementAPI/CreateAdminTool.cs
```

Or use the API endpoint to create an admin user.

### 🔒 Security Recommendations

#### 1. **Change JWT Secret** (Important!)
In `appsettings.Production.json`, replace the JWT secret with a strong random key:
```json
"Jwt": {
  "Secret": "YOUR_VERY_STRONG_RANDOM_SECRET_KEY_HERE_AT_LEAST_32_CHARACTERS",
  "ExpirationDays": 7
}
```

#### 2. **Environment Variables** (Recommended for Production)
Instead of hardcoding credentials, use environment variables:

**In Azure/AWS/Other Cloud Platforms:**
- Set `ConnectionStrings__MongoDB` as an environment variable
- Set `Jwt__Secret` as an environment variable

**Locally with User Secrets:**
```powershell
dotnet user-secrets init --project GymManagementAPI
dotnet user-secrets set "ConnectionStrings:MongoDB" "your-connection-string" --project GymManagementAPI
dotnet user-secrets set "Jwt:Secret" "your-jwt-secret" --project GymManagementAPI
```

#### 3. **Network Access** (Important!)
- In MongoDB Atlas Dashboard → Network Access
- For production, restrict to specific IP addresses
- Remove "Allow Access from Anywhere" if added for testing

#### 4. **Never Commit Secrets to Git**
The `.gitignore` should already exclude sensitive files, but double-check:
- ✅ `appsettings.Production.json` should NOT be committed with real secrets
- ✅ Use environment variables or user secrets for deployment
- ✅ The connection string contains your password - keep it secure!

### 🔄 Migrating Existing Data

If you have data in your local MongoDB that needs to be migrated:

#### Export from Local:
```powershell
mongodump --db=gym_management --out=./backup
```

#### Import to Atlas:
```powershell
mongorestore --uri="mongodb+srv://dionedaeliseo_db_user:efAqJP5BCYPvoktE@gymmanagement.gzqjhpb.mongodb.net/" --db=gym_management ./backup/gym_management
```

### 🌐 Atlas Dashboard Features

Access your MongoDB Atlas dashboard to:
- 📊 Monitor database performance
- 👥 View and manage data
- 🔍 Create indexes for better performance
- 📈 View metrics and logs
- 💾 Set up automated backups
- ⚡ Configure alerts

### 📱 Testing the Connection

Run the application and check the console output:
```
✅ Connected to MongoDB successfully!
Database: gym_management
🚀 Server is running on http://localhost:3000
```

If you see this, your Atlas connection is working perfectly!

### 🆘 Troubleshooting

#### Connection Issues:
1. **Verify Network Access**: Check Atlas → Network Access → Your IP is allowed
2. **Verify Credentials**: Username and password are correct
3. **Check Connection String**: Format is correct with proper encoding

#### Password Contains Special Characters:
If your password has special characters (like @, #, etc.), they need to be URL-encoded:
- @ → %40
- # → %23
- $ → %24
- % → %25
- etc.

#### Firewall Issues:
- MongoDB Atlas uses port 27017
- Ensure your firewall allows outbound connections to MongoDB Atlas

### 📞 Support
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- MongoDB University: https://university.mongodb.com/ (Free courses)

---

**🎉 Your application is now running on MongoDB Atlas Cloud!**
