import Fastify from 'fastify';
import AdminJS from 'adminjs';
import AdminJSFastify from '@adminjs/fastify';
import AdminJSSequelize from '@adminjs/sequelize';
import { DataTypes, Sequelize } from 'sequelize';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fastifyEnv from '@fastify/env';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { UUID } from 'crypto';

// Load environment variables
dotenv.config();

const port = 3000;

// Initialize Sequelize
const sequelize = new Sequelize(`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ep-little-bird-a54kiydn-pooler.us-east-2.aws.neon.tech/moviedb?sslmode=require`);

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

// Define Movie model
const Movie = sequelize.define('Movie', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnail: {
    type: DataTypes.TEXT,
  },
  description:  {
    type : DataTypes.TEXT
  },
  videoLink: {
    type: DataTypes.TEXT,
  },
});

// Initialize AdminJS
AdminJS.registerAdapter(AdminJSSequelize);
const adminJs = new AdminJS({
  branding: {
    companyName: "Add Movies",
    logo: "https://i.ibb.co.com/8DGFMT9m/movie.png",
    favicon: "https://i.ibb.co.com/h1nkyGG1/moveicon.png",
    theme: {
      colors: {
        primary100: '#3B82F6', // Primary color
        accent: '#F59E0B', // Accent color
      },
    },
  },
  resources: [Movie],
  rootPath: '/admin',
});

// Initialize Fastify
const fastify = Fastify({ logger: true });

// Register fastify-env plugin
fastify.register(fastifyEnv, {
  schema: {
    type: 'object',
    required: ['DATABASE_URL', 'ADMINJS_COOKIE_SECRET'],
    properties: {
      DATABASE_URL: { type: 'string' },
      ADMINJS_COOKIE_SECRET: { type: 'string' },
    },
  },
  dotenv: true,
});

// Register CORS (Allow all origins)
fastify.register(cors, {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Register fastify-swagger and fastify-swagger-ui plugins
fastify.register(fastifySwagger);
fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

// Register AdminJS routes
AdminJSFastify.buildRouter(adminJs, fastify);

// GET route to retrieve all movies
fastify.get('/movies', async (request, reply) => {
  try {
    // Query the database to fetch all movies
    const movies = await Movie.findAll();

    // Return all movies as JSON
    reply.status(200).send({
      message: 'All movies retrieved successfully',
      movies,
    });
  } catch (error) {
    // Handle any errors
    reply.status(500).send({ error: 'Failed to retrieve movies' });
  }
});
// Define type for params
interface Params {
  id: UUID; 
}

// GET route to retrieve a movie by its ID
fastify.get('/movies/:id', async (request, reply) => {
  const { id } = request.params as Params;

  try {
    // Query the database for the movie with the given ID
    const movie = await Movie.findByPk(id);  // findByPk is used to find a record by primary key

    if (!movie) {
      return reply.status(404).send({ message: 'Movie not found' });
    }

    // Return the movie data in JSON format
    reply.status(200).send({
      message: 'Movie retrieved successfully',
      movie,
    });
  } catch (error) {
    // Handle any errors
    reply.status(500).send({ error: 'Failed to retrieve movie' });
  }
});

// Default route
fastify.get('/', (request, reply) => {
  reply.send({ message: `Server is running on http://localhost:${port}` });
});

// Start the server
const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
