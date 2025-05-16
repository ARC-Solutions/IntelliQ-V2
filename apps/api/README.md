# IntelliQ API

This directory contains the backend API services for the IntelliQ project. The API is designed to handle various functionalities such as quiz generation, user management, and more.

## API Documentation

For detailed API documentation, please refer to the [IntelliQ API Reference](https://docs.intelliq.dev/api-reference/introduction).

## Setup

To set up the API locally, follow these steps:

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. To deploy the API, use:
   ```bash
   npm run deploy
   ```

## Configuration

- **wrangler.toml**: Configuration for Cloudflare Workers.
- **tsconfig.json**: TypeScript configuration file.
- **drizzle/**: Contains database migration and schema files.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](../../LICENSE) file for details.
