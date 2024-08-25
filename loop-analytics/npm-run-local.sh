#!/bin/bash

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

export NODE_ENV="develop"
export PORT="3040"
export DB_TYPE="postgres"
export DB_HOST="localhost"
export DB_PORT="5432"
# export DB_USERNAME="devuser"
export DB_USERNAME="doadmin"
export DB_PASSWORD="db123456"
# export DB_NAME="loop_freight_dev"
export DB_NAME="loop_freight_booking_prod"
export AUTH_SERVICE="https://api-dev.loopfreight.io/lf-auth/api/v1"
export USER_SERVICE="https://api-dev.loopfreight.io/lf-user/api/v1"
export COMPANY_SERVICE="https://api-dev.loopfreight.io/lf-company/api/v1"
export SECRET_KEY="hhggh5e45454gfgfcfcgfvhv434345678u"
export SENTRY_DSN="https://2dbb7f5ffabe4936958a6b04f33617e4@o1151275.ingest.sentry.io/6290388"
export SENTRY_ENV="development"
export NEST_DEBUG=1

npm run "$1"
