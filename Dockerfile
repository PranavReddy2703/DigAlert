# Use the official lightweight Python 3.10 slim image
FROM python:3.10-slim

# Set environment variables to keep Python behavior predictable and clean
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set working directory inside the container
WORKDIR /app

# Install essential system dependencies (for building any database or C-based packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy python backend requirements
COPY backend/requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source files
COPY backend/ /app/

# Expose the API port
EXPOSE 8000

# Run database seed automatically if needed and start the Uvicorn application server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
