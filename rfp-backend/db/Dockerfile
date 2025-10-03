FROM postgres:13

# Install build dependencies required to compile pgvector
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       clang \
       llvm \
       git \
       ca-certificates \
       pkg-config \
       libxml2-dev \
       postgresql-server-dev-13 \
    && git clone https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make && make install \
    && rm -rf /tmp/pgvector \
    && apt-get remove -y --purge git build-essential clang llvm pkg-config \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy DB init scripts to default entrypoint dir (executed at first run)
COPY init/ /docker-entrypoint-initdb.d/

EXPOSE 5432
