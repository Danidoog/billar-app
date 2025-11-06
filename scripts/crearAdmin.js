// scripts/crearAdmin.js
// Script para crear el primer usuario administrador
// Ejecutar con: node scripts/crearAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configuración de MongoDB
const MONGODB_URI = "mongodb+srv://danielcobo_db_user:VXyXF7eQTXH9mn2u@danidoog.ovuttnd.mongodb.net/billar_db?retryWrites=true&w=majority&appName=danidoog";

// Datos del admin
const ADMIN_DATA = {
  nombre: 'Administrador',
  email: 'admin@billiards.com',
  password: 'admin123', // Cambiar en producción
  rol: 'Admin',
  activo: true,
};

// Schema simplificado (copia del modelo)
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  password: String,
  rol: String,
  activo: Boolean,
}, { timestamps: true });

const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);

async function crearAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe
    const adminExistente = await Usuario.findOne({ email: ADMIN_DATA.email });
    
    if (adminExistente) {
      console.log('⚠️  El usuario admin ya existe');
      console.log('📧 Email:', ADMIN_DATA.email);
      process.exit(0);
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_DATA.password, salt);

    // Crear admin
    const admin = await Usuario.create({
      ...ADMIN_DATA,
      password: passwordHash,
    });

    console.log('');
    console.log('🎉 ¡Usuario administrador creado exitosamente!');
    console.log('');
    console.log('📋 Credenciales:');
    console.log('   Email:', ADMIN_DATA.email);
    console.log('   Contraseña:', ADMIN_DATA.password);
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearAdmin();