# Finance App Backend

Backend API para la aplicación de finanzas personales. Construido con Node.js, Express, TypeScript y PostgreSQL.

## 🚀 Características

- **Autenticación JWT** - Registro y login seguro
- **CRUD de Transacciones** - Crear, leer, actualizar y eliminar transacciones
- **Estadísticas** - Resúmenes financieros por período
- **Validación de datos** - Validación robusta con express-validator
- **Seguridad** - Headers de seguridad con Helmet, CORS configurado
- **TypeScript** - Tipado estático para mejor desarrollo
- **Base de datos PostgreSQL** - Almacenamiento confiable y escalable

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 12+ (para desarrollo local)
- npm o yarn
- Cuenta Xata (para producción - gratis 15GB)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   cd finance-app-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
    ```bash
    cp .env.template .env
    ```
    Edita el archivo `.env` con tus credenciales:
    ```env
    # Para desarrollo local
    DB_PASSWORD=tu_password_de_postgresql
    JWT_SECRET=tu_clave_secreta_jwt_muy_segura
    JWT_REFRESH_SECRET=tu_clave_refresh_jwt_muy_segura
    
    # Para producción (Xata PostgreSQL)
    XATA_DATABASE_URL=postgresql://workspace:apikey@region.sql.xata.sh:5432/finance-app-backend:main?sslmode=require
    ```

4. **Configurar base de datos**
    
    **Para desarrollo local:**
    - Asegúrate de que PostgreSQL esté ejecutándose
    - La base de datos `finance_app` debe existir con las tablas creadas
    
    **Para producción:**
    - Crear cuenta en [Xata.io](https://xata.io) (gratis)
    - Seguir `DEPLOY_READY_CHECKLIST.md` para configuración completa

## 🚦 Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start

# Ejecutar tests
npm test
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario (requiere token)

### Transacciones
- `POST /api/transactions` - Crear transacción
- `GET /api/transactions` - Obtener todas las transacciones del usuario
- `GET /api/transactions/stats` - Obtener estadísticas financieras
- `GET /api/transactions/:id` - Obtener transacción específica
- `PUT /api/transactions/:id` - Actualizar transacción
- `DELETE /api/transactions/:id` - Eliminar transacción

### Salud del Sistema
- `GET /health` - Verificar estado del servidor

## 🔑 Autenticación

El API usa JWT (JSON Web Tokens) para autenticación. Incluye el token en el header:

```
Authorization: Bearer tu_jwt_token_aqui
```

## 📊 Estructura del Proyecto

```
src/
├── config/          # Configuración de base de datos
├── controllers/     # Lógica de negocio
├── middleware/      # Middleware personalizado
├── models/          # Modelos de datos
├── routes/          # Definición de rutas
├── utils/           # Utilidades y validadores
└── index.ts         # Punto de entrada del servidor
```

## 🗄️ Esquema de Base de Datos

### Tabla: users
- `id` - Primary key
- `email` - Email único del usuario
- `name` - Nombre del usuario
- `password_hash` - Contraseña hasheada
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización

### Tabla: transactions
- `id` - Primary key
- `user_id` - Foreign key a users
- `type` - 'income' o 'expense'
- `amount` - Monto de la transacción
- `category` - Categoría de la transacción
- `description` - Descripción opcional
- `date` - Fecha de la transacción
- `created_at` - Fecha de creación
- `updated_at` - Fecha de actualización

## 🔒 Seguridad

- Contraseñas hasheadas con bcryptjs
- Headers de seguridad con Helmet
- Validación de entrada con express-validator
- CORS configurado para el frontend
- JWT con expiración configurable

## 🚀 Deployment

Para producción:

1. **Compilar el proyecto**
   ```bash
   npm run build
   ```

2. **Configurar variables de entorno de producción**
   ```env
   NODE_ENV=production
   DB_PASSWORD=tu_password_de_produccion
   JWT_SECRET=clave_super_secreta_de_produccion
   ```

3. **Ejecutar en producción**
   ```bash
   npm start
   ```

## 📝 Notas de Desarrollo

- El servidor se ejecuta en el puerto 3001 por defecto
- Hot reload habilitado en modo desarrollo
- Logs detallados con Morgan
- Manejo graceful de shutdown
- Validación automática de conexión a base de datos al iniciar

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
