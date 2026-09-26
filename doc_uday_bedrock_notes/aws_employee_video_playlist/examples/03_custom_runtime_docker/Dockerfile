# =====================================================================
# EPISODE 03: Runtime Deep Dive
# Topic: Constructing Dockerfiles for Bedrock AgentCore microVMs
# =====================================================================

# 1. Base Image selection
# Bedrock AgentCore Runtime expects a standard Linux environment with Python 3.11+.
# (रनटाइम को चलाने के लिए पाइथन का ऑफिशियल लिनक्स बेस इमेज)
FROM python:3.11-slim

# 2. Set System Working Directory
# (इमेज के अंदर काम करने के लिए फ़ोल्डर सेट करना)
WORKDIR /app

# 3. Install System Dependencies
# Firecracker VMs require basic network utilities and Chromium packages
# if running Browser automation tools.
# (सिस्टम में जरूरी यूटिलिटीज़ और क्रोमियम पैकेज डालना)
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    libnss3 \
    libgconf-2-4 \
    libnss3-dev \
    libxss1 \
    libasound2 \
    libxtst6 \
    libatk1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy Dependencies list
# (पाइथन लाइब्रेरीज की लिस्ट को कॉपी करना)
COPY requirements.txt .

# 5. Install Python Libraries
# Install bedrock-agent-core runtime SDK and any packages like strands-sdk
# (लाइब्रेरीज इंस्टॉल करना)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy Application Code
# Copy all local agent scripts into the container
# (सारे लोकल एजेंट कोड को कंटेनर में कॉपी करना)
COPY . .

# 7. Expose Port
# AgentCore Runtime runs a server inside the VM to listen for invoke triggers
# (पोर्ट 8080 को ओपन रखना ताकि ट्रिगर्स आ सकें)
EXPOSE 8080

# 8. Define Default Launch Command
# Starts the Bedrock AgentCore Runtime application server.
# (कंटेनर शुरू होते ही सर्वर चालू करने की कमांड)
CMD ["python", "main.py"]
