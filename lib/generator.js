const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function generateProject() {
  console.log('🚀 Générateur de projet Express.js avec architecture CRUD');
  
  const projectName = await ask('Nom du projet: ');
  const projectPath = path.join(process.cwd(), projectName);
  
  if (fs.existsSync(projectPath)) {
    console.error(`⛔ Le dossier ${projectName} existe déjà.`);
    process.exit(1);
  }
  
  // Création de la structure du projet
  fs.mkdirSync(projectPath);
  process.chdir(projectPath);
  
  // Initialisation du package.json
  console.log('📦 Initialisation du package.json...');
  execSync('npm init -y');
  
  // Installation des dépendances
  console.log('📚 Installation des dépendances...');
  execSync('npm install express mongoose dotenv cors helmet morgan jsonwebtoken bcryptjs');
  execSync('npm install --save-dev nodemon');
  
  // Mettre à jour package.json avec les scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.scripts = {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  };
  packageJson.type = "module"; // Pour utiliser les imports ES6
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  // Création des dossiers
  const directories = [
    'src',
    'src/config',
    'src/controllers',
    'src/middleware',
    'src/models',
    'src/routes',
    'src/utils'
  ];

  directories.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
  });

  // Création du fichier .env
  const envContent = `PORT=3000
MONGODB_URI=mongodb://localhost:27017/${projectName}
JWT_SECRET=votre_secret_jwt
NODE_ENV=development`;
  fs.writeFileSync('.env', envContent);

  // Création du fichier .gitignore
  const gitignoreContent = `node_modules
.env
.DS_Store
npm-debug.log
*.log`;
  fs.writeFileSync('.gitignore', gitignoreContent);

  // Création du fichier server.js
  const serverContent = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Importer les routes
import userRoutes from './routes/userRoutes.js';

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Middleware de gestion d'erreur
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`Serveur démarré sur le port \${PORT}\`);
});`;
  fs.writeFileSync('src/server.js', serverContent);

  // Création du fichier db.js
  const dbContent = `import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(\`MongoDB connecté: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Erreur: \${error.message}\`);
    process.exit(1);
  }
};

export default connectDB;`;
  fs.writeFileSync('src/config/db.js', dbContent);

  // Création du modèle User.js
  const userModelContent = `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Middleware pour hasher le mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour vérifier le mot de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;`;
  fs.writeFileSync('src/models/User.js', userModelContent);

  // Création du contrôleur userController.js
  const userControllerContent = `import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Enregistrer un nouvel utilisateur
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('L\'utilisateur existe déjà');
  }

  const user = await User.create({
    name,
    email,
    password
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Données utilisateur invalides');
  }
};

// @desc    Authentifier l'utilisateur & obtenir un token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Email ou mot de passe invalide');
  }
};

// @desc    Obtenir le profil utilisateur
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
};

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
};

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: 'Utilisateur supprimé' });
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé');
  }
};`;
  fs.writeFileSync('src/controllers/userController.js', userControllerContent);

  // Création de la route userRoutes.js
  const userRoutesContent = `import express from 'express';
import { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile, 
  getUsers, 
  deleteUser 
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(registerUser)
  .get(protect, admin, getUsers);

router.post('/login', authUser);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/:id')
  .delete(protect, admin, deleteUser);

export default router;`;
  fs.writeFileSync('src/routes/userRoutes.js', userRoutesContent);

  // Création du middleware authMiddleware.js
  const authMiddlewareContent = `import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Non autorisé, token invalide');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Non autorisé, pas de token');
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Non autorisé, privilèges administrateur requis');
  }
};`;
  fs.writeFileSync('src/middleware/authMiddleware.js', authMiddlewareContent);

  // Création du utilitaire generateToken.js
  const generateTokenContent = `import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export default generateToken;`;
  fs.writeFileSync('src/utils/generateToken.js', generateTokenContent);

  console.log(`
✅ Projet '${projectName}' créé avec succès!

Pour démarrer le serveur de développement:
  cd ${projectName}
  npm run dev

Structure du projet:
  ├── .env              # Variables d'environnement
  ├── .gitignore        # Fichiers à ignorer par Git
  ├── package.json      # Configuration du projet
  └── src/
      ├── config/       # Configuration (BD, etc.)
      ├── controllers/  # Logique métier
      ├── middleware/   # Middleware (auth, etc.)
      ├── models/       # Modèles de données
      ├── routes/       # Routes API
      ├── utils/        # Utilitaires
      └── server.js     # Point d'entrée

API routes disponibles:
  POST   /api/users        # Enregistrer un utilisateur
  POST   /api/users/login  # Authentifier un utilisateur
  GET    /api/users/profile # Obtenir le profil (auth)
  PUT    /api/users/profile # Mettre à jour le profil (auth)
  GET    /api/users        # Lister tous les utilisateurs (admin)
  DELETE /api/users/:id    # Supprimer un utilisateur (admin)
  `);

  rl.close();
}

module.exports = {
  generateProject
};