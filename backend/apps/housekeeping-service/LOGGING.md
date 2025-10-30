# Housekeeping Service - Logging

## 📁 Log Files Location

```
backend/logs/housekeeping/
├── housekeeping-2025-10-29.log      # Combined logs (all levels)
├── archive-operations-2025-10-29.log # Archive operations only (JSON)
└── error-2025-10-29.log             # Errors only
```

## 📋 Log Types

### 1. Combined Logs (`housekeeping-YYYY-MM-DD.log`)
- **Retention**: 30 days
- **Max Size**: 20MB per file
- **Format**: Plain text with timestamp
- **Contains**: All log levels (info, warn, error)

**Example:**
```
[2025-10-29 14:30:45] [INFO] 📦 Archiving (copy + delete) inactive items older than 10/19/2025
[2025-10-29 14:30:46] [INFO]    ✓ Batch 1: 100 items archived (deleted from primary)
[2025-10-29 14:31:47] [INFO]    ✓ Batch 2: 50 items archived (deleted from primary)
[2025-10-29 14:31:47] [INFO]    ✅ Completed: 150 items in 62.3s
```

### 2. Archive Operations (`archive-operations-YYYY-MM-DD.log`)
- **Retention**: 90 days (longer for audit)
- **Max Size**: 50MB per file
- **Format**: JSON (easy to parse/analyze)
- **Contains**: Structured archive operation logs

**Example:**
```json
{
  "level": "info",
  "message": "Archive Operation",
  "operation": "archive_items",
  "table": "items",
  "recordsProcessed": 150,
  "recordsArchived": 150,
  "recordsDeleted": 150,
  "duration": 62.3,
  "startDate": "2025-10-19T00:00:00.000Z",
  "endDate": "2025-10-29T14:31:47.234Z",
  "status": "success",
  "timestamp": "2025-10-29T14:31:47.234Z"
}
```

### 3. Error Logs (`error-YYYY-MM-DD.log`)
- **Retention**: 60 days
- **Max Size**: 20MB per file
- **Format**: JSON with stack traces
- **Contains**: Errors only

**Example:**
```json
{
  "level": "error",
  "message": "Archive items FAILED",
  "error": "Foreign key constraint violated",
  "trace": "Error: Foreign key constraint violated\n    at...",
  "timestamp": "2025-10-29T14:31:47.234Z"
}
```

## 🔍 How to View Logs

### Real-time Monitoring
```bash
# Watch all logs
tail -f logs/housekeeping/housekeeping-$(date +%Y-%m-%d).log

# Watch only archive operations
tail -f logs/housekeeping/archive-operations-$(date +%Y-%m-%d).log

# Watch errors
tail -f logs/housekeeping/error-$(date +%Y-%m-%d).log
```

### Search Logs
```bash
# Find all archive operations for items table
grep '"table":"items"' logs/housekeeping/archive-operations-*.log

# Find errors
grep -r "ERROR" logs/housekeeping/housekeeping-*.log

# Count successful operations today
grep "success" logs/housekeeping/archive-operations-$(date +%Y-%m-%d).log | wc -l
```

### Parse JSON Logs
```bash
# Pretty print archive operations
cat logs/housekeeping/archive-operations-$(date +%Y-%m-%d).log | jq .

# Get total records archived today
cat logs/housekeeping/archive-operations-$(date +%Y-%m-d).log | \
  jq -s 'map(.recordsArchived) | add'

# Find operations that took > 60 seconds
cat logs/housekeeping/archive-operations-*.log | \
  jq 'select(.duration > 60)'
```

## 📊 Log Analysis Examples

### Daily Statistics
```bash
#!/bin/bash
# Get daily archive statistics
cat logs/housekeeping/archive-operations-$(date +%Y-%m-%d).log | \
  jq -s 'group_by(.table) | 
         map({
           table: .[0].table, 
           total_records: map(.recordsArchived) | add,
           operations: length
         })'
```

### Performance Monitoring
```bash
# Average duration per table
cat logs/housekeeping/archive-operations-*.log | \
  jq -s 'group_by(.table) | 
         map({
           table: .[0].table,
           avg_duration: (map(.duration) | add / length)
         })'
```

## 🔧 Configuration

Edit `housekeeping-logger.service.ts` to change settings:

```typescript
// Retention period (days)
maxFiles: '30d'  // Combined logs
maxFiles: '90d'  // Archive operations
maxFiles: '60d'  // Errors

// Max file size before rotation
maxSize: '20m'   // 20 MB
maxSize: '50m'   // 50 MB

// Log level
level: process.env.LOG_LEVEL || 'info'
```

## 🚀 Integration with Monitoring Tools

### ELK Stack (Elasticsearch + Logstash + Kibana)
```bash
# Install Filebeat to ship logs
filebeat.inputs:
  - type: log
    paths:
      - /path/to/backend/logs/housekeeping/*.log
    json.keys_under_root: true
```

### Grafana Loki
```yaml
# promtail config
scrape_configs:
  - job_name: housekeeping
    static_configs:
      - targets:
          - localhost
        labels:
          job: housekeeping
          __path__: /path/to/backend/logs/housekeeping/*.log
```

### CloudWatch (AWS)
```bash
# Install CloudWatch Agent
aws logs create-log-group --log-group-name /housekeeping/archive
```

## 📈 Metrics from Logs

Key metrics you can extract:
- Records archived per day/week/month
- Archive operation duration
- Success/failure rate
- Peak usage times
- Error trends
- Database growth rate

## 🔐 Security

- Logs contain operational data only (no sensitive user data)
- Files are created with appropriate permissions
- Automatic rotation prevents disk space issues
- Old logs are automatically deleted based on retention policy

## 💡 Best Practices

1. **Monitor disk space**: Logs can grow large over time
2. **Regular analysis**: Review logs weekly for trends
3. **Alert on errors**: Set up monitoring for error logs
4. **Archive old logs**: Move to cold storage after retention period
5. **Parse JSON logs**: Use jq or similar tools for analysis

