# perforamce_Testing_framework
This will be a performance framework which use Docker , Docker-compose ( influxdb , grafana, a common network) and k8s


# Access to InfluxDB 
```bash
docker exec -it influxdb influx -precision rfc3339

USE k6

SHOW MEASUREMENTS

SELECT COUNT(*) FROM http_reqs

http://localhost:8086/query?db=k6&q=SHOW%20MEASUREMENTS

SELECT mean("value") FROM "http_req_duration" WHERE $timeFilter GROUP BY time($__interval)
SELECT mean("value") FROM "http_req_duration" WHERE $timeFilter GROUP BY time($__interval)

```
# Build
```bash
docker compose -f docker-compose.yml up -d --build 
```

# Run k6 tests
```bash
docker compose up --build k6    
```

# Access Grafana
```bash

http://localhost:3002/?orgId=1&from=now-6h&to=now&timezone=browser

```
Grafana Username : admin
Grafana Password : admin
