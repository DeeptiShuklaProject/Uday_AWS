# CHAPTER 57 — NGINX WEB SERVER AND REVERSE PROXY

---

## 1. Introduction

### Why This Topic Exists
While Apache built the early internet, it struggled when websites started receiving massive amounts of traffic (the "C10k problem"—handling 10,000 concurrent connections). To solve this, **Nginx** (pronounced "Engine-X") was created. Nginx is an event-driven, asynchronous web server designed from the ground up for extreme performance and low memory usage. Today, Nginx powers the majority of the world's busiest websites.

### Why Linux Administrators Use It
Linux administrators use Nginx for two entirely different purposes. First, as a blisteringly fast web server to serve static content (HTML, CSS, images). Second, and more importantly, as a **Reverse Proxy**. Nginx can sit in front of slow, heavy application servers (like Java, Python, or NodeJS), intercept internet traffic, protect the backend servers, and efficiently route requests to them.

### Why Companies Care About It
Scale and Cost Efficiency. A single Nginx server can handle 50,000 simultaneous connections while consuming less than 100MB of RAM. If a company tried to handle that traffic with traditional Apache (Prefork), they would need dozens of expensive servers. Nginx allows companies to handle viral traffic spikes without their infrastructure melting down.

---

## 2. Learning Objectives

By the end of this chapter, you will be able to:
- Install and configure the Nginx web server.
- Understand the Nginx configuration block syntax (`server`, `location`).
- Host multiple websites using `server` blocks (the Nginx equivalent of Virtual Hosts).
- Configure Nginx as a Reverse Proxy to route traffic to a backend application.
- Test and apply Nginx configurations safely.

---

## 3. Beginner-Friendly Explanation

Think of a massive corporate office building:
- **Apache (The old way):** Every time a guest walks in the front door, the receptionist grabs their hand and personally walks them all the way up to the 5th floor, waits for their meeting to finish, and walks them back down. If 100 guests walk in, you need 100 receptionists. This is very expensive.
- **Nginx (The new way):** The receptionist (Nginx) is incredibly fast. They stand at a desk. Guest 1 walks in. The receptionist says, "Go to room 501," and immediately turns to Guest 2 and says, "Go to room 502." The receptionist never leaves the desk. One receptionist can handle 10,000 guests.
- **Reverse Proxy:** The receptionist is the only one who knows where the secret offices are. Guests from the outside are not allowed to go to the 5th floor directly. They MUST ask the receptionist, who passes the message up to the boss, gets the answer, and hands it back to the guest. The boss (backend server) is completely hidden from the public.

---

## 4. Core Theory

### 4.1 Event-Driven Architecture
Unlike Apache (which traditionally spawns a new process for every user), Nginx uses an asynchronous, event-driven model. It has one "Master" process and a small number of "Worker" processes (usually one per CPU core). A single worker process uses a non-blocking loop to juggle thousands of connections simultaneously. 

### 4.2 Configuration Blocks
Nginx configuration (`/etc/nginx/nginx.conf`) is written using a curly-brace syntax similar to C or JSON.
- **`http {}`**: Global settings for all web traffic.
- **`server {}`**: Defines a specific website (Equivalent to Apache's VirtualHost).
- **`location {}`**: Defines rules for specific URL paths (e.g., what to do if the user goes to `/images/` vs `/api/`).

### 4.3 The Reverse Proxy Concept
Modern web applications (like a NodeJS chat app or a Python Django site) have their own built-in web servers. But these servers are bad at security and terrible at serving static images. 
An administrator places Nginx on Port 80 facing the internet. The NodeJS app runs on Port 3000, hidden behind a firewall. Nginx intercepts the internet request, instantly serves any static images itself, and proxies (forwards) the complex data requests to NodeJS on Port 3000.

---

## 5. Internal Working

### Static vs Dynamic Content
Nginx cannot process PHP or Python code natively. If a user requests an `index.php` file, Nginx literally just reads the raw text of the PHP code and sends it to the user. To make PHP work, Nginx must act as a reverse proxy, forwarding the `.php` request to a separate backend processor (like `php-fpm`), waiting for `php-fpm` to compile the code into HTML, and then sending the HTML to the user. This separation of duties is why the modern stack is so fast.

---

## 6. Production Architecture

```mermaid
graph TD
    subgraph Nginx Reverse Proxy Architecture
        Internet["The Public Internet"]
        Firewall["Firewall (Port 80/443)"]
        
        subgraph The DMZ
            Nginx["Nginx Reverse Proxy<br/>(10.0.1.50)"]
            Static["Local SSD<br/>(Images, CSS, JS)"]
        end
        
        subgraph Internal Network (Hidden)
            App1["Node.js Application<br/>(10.0.2.10 : 3000)"]
            App2["Python API<br/>(10.0.2.11 : 8000)"]
        end
        
        Internet --> Firewall
        Firewall --> Nginx
        Nginx -->|URL: /images/| Static
        Nginx -->|URL: /app/| App1
        Nginx -->|URL: /api/| App2
    end
```

---

## 7. Command-by-Command Explanation

### 7.1 `dnf install nginx`
- **Purpose:** Installs the Nginx web server.

### 7.2 `systemctl enable --now nginx`
- **Purpose:** Starts the daemon and enables it on boot. (Note: If Apache is currently running, Nginx will fail to start because Apache is already hogging Port 80. You must stop Apache first).

### 7.3 `nginx -t`
- **Purpose:** **CRITICAL COMMAND.** Tests the syntax of the Nginx configuration files. Exactly like `httpd -t`. Never skip this.

### 7.4 `nginx -s reload`
- **Purpose:** Gracefully reloads the configuration. (This is exactly the same as `systemctl reload nginx`, but some administrators prefer the native Nginx command).

---

## 8. Syntax Breakdown

**A Basic Reverse Proxy Configuration (`/etc/nginx/conf.d/myapp.conf`)**

```nginx
server {
    listen 80;
    server_name www.myapp.com;

    # Serve static files directly
    location /static/ {
        root /var/www/myapp/public;
    }

    # Proxy everything else to the backend NodeJS app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
- `proxy_pass`: The magic directive. It tells Nginx to take the incoming HTTP request and forward it to the local port 3000.
- `proxy_set_header`: When Nginx forwards the request, the backend NodeJS server thinks Nginx (127.0.0.1) is the one making the request. Setting the `X-Real-IP` header passes the true customer's IP address through to the backend logs.

---

## 9. Parameter Explanation

| Directive | Purpose |
|:---|:---|
| `worker_processes auto;` | Automatically spawns one worker process per physical CPU core. (Highly recommended). |
| `client_max_body_size 50M;` | If a user tries to upload a video larger than this, Nginx rejects it instantly with a `413 Request Entity Too Large` error. (Default is 1M, which breaks many image upload features). |
| `index index.html;` | Defines the default file to look for when a user visits a directory. |
| `try_files $uri $uri/ =404;` | Crucial for security. Tells Nginx: "Try to serve the exact file requested. If it doesn't exist, try serving a directory. If that fails, throw a 404 error instead of letting the user browse." |

---

## 10. Sample Output Analysis

**Scenario:** We check the syntax of our configuration before reloading.
**Command:** `sudo nginx -t`

**Output:**
```text
nginx: [emerg] unknown directive "porxy_pass" in /etc/nginx/conf.d/myapp.conf:12
nginx: configuration file /etc/nginx/nginx.conf test failed
```

**Analysis:**
- **[emerg]:** A fatal error. If you had restarted the service, it would have crashed.
- **unknown directive "porxy_pass":** The administrator misspelled `proxy_pass`.
- **myapp.conf:12:** The exact file and line number where the typo exists. The administrator opens line 12, fixes the typo, runs `nginx -t` again, receives `syntax is ok`, and safely reloads the daemon.

---

## 11. Architecture Diagram

```mermaid
graph LR
    subgraph The PHP-FPM Hand-off
        User["User"]
        Nginx["Nginx (Port 80)"]
        HTML["index.html"]
        PHPFPM["PHP-FPM (Port 9000)"]
        PHPFile["index.php"]
        
        User --> Nginx
        Nginx -->|If .html request| HTML
        Nginx -->|If .php request (FastCGI Proxy)| PHPFPM
        PHPFPM -->|Executes| PHPFile
        PHPFile -.->|Returns HTML output| PHPFPM
        PHPFPM -.-> Nginx
        Nginx -.-> User
    end
```

---

## 12. Workflow Diagram

```mermaid
sequenceDiagram
    participant Dev
    participant Admin
    participant Nginx
    participant Backend

    Note over Dev,Backend: Deploying a Python API
    Dev->>Admin: "I deployed a Flask API on Port 5000."
    Admin->>Nginx: Creates /etc/nginx/conf.d/api.conf
    Admin->>Nginx: Adds 'proxy_pass http://127.0.0.1:5000;'
    Admin->>Nginx: nginx -t
    Nginx-->>Admin: syntax is ok
    Admin->>Nginx: systemctl reload nginx
    Note right of Admin: Nginx is now listening on Port 80 for the API domain.
    Dev->>Nginx: HTTP GET api.company.com/users
    Nginx->>Backend: Forwards to Port 5000
    Backend-->>Nginx: Returns JSON data
    Nginx-->>Dev: Returns JSON to user
```

---

## 13. Real Production Examples

### The Nginx Drop-In Replacement
A company's WordPress blog (running on Apache) crashes every time a new article goes viral because Apache runs out of RAM. The administrator uninstalls Apache and installs Nginx and `php-fpm`. They configure Nginx to serve the WordPress images and CSS statically, and proxy the PHP execution to `php-fpm`. The next article goes viral. The server easily handles the traffic spike using only 200MB of RAM.

### Load Balancing (Preview)
Nginx isn't just a 1-to-1 reverse proxy. It can balance traffic across multiple backend servers.
```nginx
upstream backend_servers {
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend_servers;
    }
}
```
If 10 users connect, Nginx seamlessly sends 5 to server .10 and 5 to server .11, doubling the capacity of the application. (This is covered deeply in Chapter 59).

---

## 14. Common Mistakes

1. **Forgetting the semicolon (`;`)** — Every single directive inside an Nginx configuration block MUST end with a semicolon. If you forget it, `nginx -t` will throw a massive error, often pointing to the line *below* the actual mistake.
2. **SELinux Blocking the Proxy** — By default, SELinux forbids web servers from initiating outbound network connections. If you configure Nginx to `proxy_pass` to a backend server at `10.0.2.50`, Nginx will throw a `502 Bad Gateway` error, and the audit logs will show SELinux blocking it. You must run `setsebool -P httpd_can_network_connect 1`.
3. **Missing the trailing slash in `proxy_pass`** — `proxy_pass http://127.0.0.1:3000` is vastly different from `proxy_pass http://127.0.0.1:3000/`. The slash alters how Nginx manipulates the URL before passing it to the backend. Always test URL routing carefully.

---

## 15. Best Practices

- **Create Modular Configurations:** Never edit the main `/etc/nginx/nginx.conf` file to add websites. Place individual `.conf` files inside `/etc/nginx/conf.d/`. This makes it easy to disable a site by simply renaming the file to `.conf.disabled` and reloading Nginx.
- **Hide the Nginx Version:** In the `http {}` block, set `server_tokens off;`. This prevents Nginx from broadcasting its exact version number in error pages and HTTP headers, hindering automated vulnerability scanners.

---

## 16. Security Considerations

- **Denying Hidden Files:** Websites often contain hidden Git repositories (`.git`) or environment files (`.env`) full of database passwords. In Apache, developers use `.htaccess` to block this. Nginx ignores `.htaccess`. The Administrator MUST block this globally in Nginx:
```nginx
location ~ /\. {
    deny all;
}
```
If you forget this block, a hacker can easily download your entire website's source code and database credentials.

---

## 17. Performance Considerations

- **Gzip Compression:** Sending raw text (HTML/CSS/JS) over the internet wastes bandwidth. In the `http {}` block, enable `gzip on;`. Nginx will instantly compress the text before sending it, reducing bandwidth usage by 70% and making the website load blazingly fast on mobile devices.
- **Sendfile:** Ensure `sendfile on;` is active. This allows Nginx to instruct the Linux kernel to copy a file directly from the hard drive to the network card, completely bypassing user-space RAM, making static file serving almost infinitely fast.

---

## 18. Troubleshooting Guide

| Symptom | Root Cause | Resolution |
|:---|:---|:---|
| Nginx fails to start | Port 80 is in use | Run `ss -tulpn \| grep :80`. Stop Apache if it's running. |
| `502 Bad Gateway` | Backend app is dead or blocked | Check if NodeJS/Python is running. Check SELinux booleans. |
| `413 Request Entity Too Large`| Upload size limit | Increase `client_max_body_size` in the `server` block. |
| `nginx -t` fails | Syntax error | Check for missing semicolons (`;`) or unclosed curly braces (`}`). |

---

## 19. Practical Labs

**Lab 57.1:** Installing and Serving Static Content
1. `sudo systemctl stop httpd` (Ensure Apache isn't blocking Port 80).
2. `sudo dnf install nginx -y`
3. `sudo systemctl enable --now nginx`
4. `sudo firewall-cmd --add-service=http --permanent && sudo firewall-cmd --reload`
5. `echo "<h1>Nginx is Fast</h1>" | sudo tee /usr/share/nginx/html/index.html` (Note: Nginx default root is different from Apache!)
6. Open your browser and view the page.

**Lab 57.2:** Setting up a Reverse Proxy
1. We will simulate a backend app using python's built-in web server.
2. `cd /tmp && echo "Backend API" > api.txt`
3. `python3 -m http.server 8080 &` (Starts a dummy backend on 8080).
4. `sudo vim /etc/nginx/conf.d/proxy.conf`
```nginx
server {
    listen 80;
    server_name myapi.local;
    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```
5. `sudo nginx -t && sudo systemctl reload nginx`
6. `curl -H "Host: myapi.local" http://localhost/api.txt`
7. Nginx intercepts Port 80 and seamlessly proxies to Python on 8080!

---

## 20. Mini Project

The Gzip Test.
1. Download a massive, uncompressed text file to the Nginx root directory (e.g., a 1MB lorem ipsum file).
2. Download it from your laptop using `curl -I`:
   `curl -I http://<server_ip>/large.txt`
3. Notice the `Content-Length`.
4. Edit `/etc/nginx/nginx.conf`, find the `gzip` section, uncomment `gzip on;` and `gzip_types text/plain;`.
5. Reload Nginx.
6. Download it again, telling Nginx your browser supports compression:
   `curl -I -H "Accept-Encoding: gzip" http://<server_ip>/large.txt`
7. Notice the `Content-Encoding: gzip`. The actual data sent over the wire is now vastly smaller.

---

## 21. Assignments

1. What is the fundamental architectural difference between Apache (Prefork) and Nginx?
2. What directive in Nginx is used to forward internet traffic to a hidden backend application server?
3. Why might you receive a `502 Bad Gateway` error even if both Nginx and the backend application are running perfectly?

---

## 22. Interview Questions

### Basic
1. **Q: You just edited an Nginx configuration file. What command MUST you run before restarting the service?**
   A: `nginx -t`

2. **Q: In Apache, you use `<VirtualHost>` blocks to host multiple websites. What is the equivalent block called in Nginx?**
   A: The `server {}` block.

### Intermediate
3. **Q: A developer deployed a new web application. They complain that users cannot upload profile pictures larger than 1MB. The developer swears their application code allows 10MB files. Nginx is sitting in front of the application. How do you fix this?**
   A: Nginx has a default `client_max_body_size` limit of 1MB. It intercepts and rejects the upload before the developer's application even sees it. I must edit the Nginx configuration block for that website and add `client_max_body_size 10M;`, and then reload Nginx.

4. **Q: Explain the difference between `proxy_pass` and `root` directives in an Nginx `location` block.**
   A: The `root` directive tells Nginx to act as a traditional web server; it looks on the local hard drive at that specific path and serves the static file directly to the user. The `proxy_pass` directive tells Nginx to act as a reverse proxy; it forwards the HTTP request to another web server (like a local NodeJS app or an external IP) and returns the response from that server.

### Scenario-Based
5. **Q: You are migrating a website from Apache to Nginx. The developer has a `.htaccess` file full of complex redirect rules. You configure the Nginx `server` block, point it to the directory, and start Nginx. The main page loads, but all the developer's redirects are broken. Why?**
   A: Nginx does not support `.htaccess` files. It completely ignores them by design (parsing `.htaccess` on every request is slow, which violates Nginx's performance goals). All the redirect rules inside the `.htaccess` file must be manually translated into Nginx `rewrite` or `return` directives and placed directly inside the main Nginx configuration file.

---

## 23. Chapter Summary and Quick Revision Notes

- **Nginx:** High-performance, event-driven web server and reverse proxy.
- **Reverse Proxy:** Intercepts traffic on Port 80/443 and passes it to backend application servers (NodeJS, Python, PHP-FPM).
- **`nginx -t`:** Always check syntax. Missing semicolons (`;`) are the #1 error.
- **Blocks:** `http {}` (Global) -> `server {}` (vHost) -> `location {}` (URL routing).
- **`.htaccess`:** Not supported. All rules must go in the main config.
- **SELinux:** Must flip the `httpd_can_network_connect` boolean to allow `proxy_pass` to work.

---

## 24. Cheat Sheet

| Command / Syntax | Purpose |
|:---|:---|
| `nginx -t` | Verify syntax (Catch missing semicolons) |
| `systemctl reload nginx` | Apply configuration safely |
| `server { }` | Define a virtual host |
| `listen 80;` | Bind to a port |
| `server_name domain.com;` | Respond to a specific domain |
| `root /var/www/html;` | Serve static files from this folder |
| `proxy_pass http://127.0.0.1:3000;` | Forward requests to backend app |
| `client_max_body_size 50M;` | Increase upload limits |
