# HarishFresh

HarishFresh is an e-commerce platform offering fresh vegetables, fruits, and more. 

## Environment Configuration

The application is completely environment-driven. To ensure that sensitive credentials remain secure while making local setup and production deployment straightforward, we use environment variable templates.

### Backend

1. The file `backend/.env.example` serves as the backend environment variable template.
2. Copy this template to `backend/.env` and populate it with your environment-specific values.
3. The actual `.env` file must remain excluded from version control.

```bash
cp backend/.env.example backend/.env
```

### Frontend

1. The file `frontend/.env.local.example` serves as the frontend environment variable template.
2. Copy this template to `frontend/.env.local` and populate it with your environment-specific values.
3. The actual `.env.local` file must remain excluded from version control.

```bash
cp frontend/.env.local.example frontend/.env.local
```

For detailed deployment instructions, please refer to [deployment.md](./deployment.md).