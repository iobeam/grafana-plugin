# grafana-plugin

Use our Grafana connector to visualize your iobeam data:

1. Go to your Grafana plugins directory (e.g., `cd /usr/local/var/lib/grafana/plugins`)

1. Git clone the iobeam plugin: `git clone https://github.com/iobeam/grafana-plugin iobeam`

1. Login to Grafana, add a new data source:
```
    Name: [whatever you want]
    
    Type: iobeam
    
    Url: https://api.iobeam.com (access: proxy, no auth)
    
    Project_id: PROJECT_ID (for your project)
    
    Project_token: PROJECT_TOKEN (for your project)
```

FIN
