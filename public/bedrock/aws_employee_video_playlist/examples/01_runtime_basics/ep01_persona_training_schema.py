import os
import json
import logging
from typing import Dict, Any

# =====================================================================
# EPISODE 01: Persona Configurations and Database Column Standards
# File: ep01_persona_training_schema.py (Enterprise Schema Standard)
# =====================================================================

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# 1. ENTERPRISE DATABASE SCHEMA STANDARDS (DYNAMODB COLUMN SPECIFICATION)
# (डेटाबेस स्कीमा मानक - एंटरप्राइज़ स्तर पर प्रयुक्त कॉलम नाम)
#
# PK (Partition Key):  session_id   (String) - Unique chat execution session hash
# SK (Sort Key):       actor_id     (String) - Cognito validated user identity
# Attribute:           persona_type (String) - Enum: ["CAR_DEALER", "INSURANCE_ADVISOR", "TECH_SUPPORT"]
# Attribute:           instruction  (String) - Core system prompts directing LLM behavior
# Attribute:           turns        (List)   - Conversation log (list of messages)
# Attribute:           cost_dollars (Number) - Total running transaction expense

# 2. Instruction Prompt Templates (How Bedrock is configured/steered)
# (प्रॉम्प्ट टेम्पलेट्स - बेडरॉक एजेंट के व्यवहार और टोन को सेट करना)
PERSONA_TEMPLATES = {
    "CAR_DEALER": (
        "You are an elite, polite automobile salesperson representing Nishu Auto Dealership.\n"
        "Your goal is to assist customers with inventory catalog inquiries and test drive requests.\n"
        "Strict Rule: Do not discuss insurance or financial investment advice.\n"
        "Response Tone: Enthusiastic, helpful, sales-oriented."
    ),
    "INSURANCE_ADVISOR": (
        "You are a licensed compliance-bound claims underwriter representing Deepti Care Insurance.\n"
        "Your goal is to verify active coverage, explain policy deductibles, and evaluate risk factors.\n"
        "Strict Rule: Under no circumstances guarantee payouts or double-money yields.\n"
        "Response Tone: Formal, objective, analytical."
    )
}

class BedrockPersonaEngine:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        # Simulating standard DynamoDB record storage
        self.session_table = {}

    def save_session_state(self, session_id: str, actor_id: str, persona: str, chat_turns: list) -> Dict[str, Any]:
        """
        Saves agent state using the industry-standard column layout.
        (उद्योग मानक कॉलम लेआउट का उपयोग करके एजेंट स्टेट को सहेजना)
        """
        # Load system instruction template for the chosen persona
        system_instruction = PERSONA_TEMPLATES.get(persona, "You are a helpful general assistant.")
        
        record = {
            "session_id": session_id,               # Standard PK column
            "actor_id": actor_id,                   # Standard SK column
            "persona_type": persona,                 # Persona definition column
            "instruction": system_instruction,       # Prompt context column
            "turns": chat_turns,                     # Nested array column for message history
            "cost_dollars": len(chat_turns) * 0.005 # Calculation tracking column
        }
        
        # Save to memory (simulating DynamoDB put_item)
        key = f"{session_id}#{actor_id}"
        self.session_table[key] = record
        logging.info(f"[DB] Session state successfully stored for key: {key}")
        return record

    def compile_bedrock_prompt(self, session_id: str, actor_id: str, user_input: str) -> str:
        """
        Compiles the system prompt + chat history into the final format Bedrock expects.
        (बेडरॉक LLM के लिए प्रॉम्प्ट और चैट हिस्ट्री का कंपाइलेशन)
        """
        key = f"{session_id}#{actor_id}"
        record = self.session_table.get(key)
        if not record:
            raise KeyError("Active session not found in database.")
            
        # Standard structural layout format fed to Claude/Llama on Bedrock
        compiled_prompt = (
            f"System Instruction:\n{record['instruction']}\n\n"
            f"Conversation History:\n"
        )
        
        # Add past turns
        for turn in record["turns"]:
            compiled_prompt += f"{turn['role'].capitalize()}: {turn['content']}\n"
            
        # Add current user query
        compiled_prompt += f"User: {user_input}\nAssistant:"
        return compiled_prompt

if __name__ == "__main__":
    engine = BedrockPersonaEngine("tenant_enterprise_01")
    
    # 1. Car Dealer Session
    print("\n--- Simulating Car Dealer Persona Config & Database Save ---")
    dealer_turns = [
        {"role": "user", "content": "Hi, what cars do you have?"},
        {"role": "assistant", "content": "Hello! I can search our inventory for SUVs, Sedans or Electric vehicles. What are you looking for?"}
    ]
    
    state1 = engine.save_session_state(
        session_id="sess_car_dealer_01",
        actor_id="auth0|user_nishu",
        persona="CAR_DEALER",
        chat_turns=dealer_turns
    )
    
    # Compile prompt to feed to Bedrock runtime
    prompt1 = engine.compile_bedrock_prompt("sess_car_dealer_01", "auth0|user_nishu", "Do you have any Tesla model?")
    print("Compiled Bedrock Prompt Payload:\n")
    print(prompt1)
    
    # 2. Insurance Advisor Session
    print("\n--- Simulating Insurance Advisor Persona Config & Database Save ---")
    insurance_turns = [
        {"role": "user", "content": "I need to file a claim."},
        {"role": "assistant", "content": "I can help with that. Please share the incident details and policy number."}
    ]
    
    state2 = engine.save_session_state(
        session_id="sess_insurance_01",
        actor_id="auth0|user_deepti",
        persona="INSURANCE_ADVISOR",
        chat_turns=insurance_turns
    )
    
    prompt2 = engine.compile_bedrock_prompt("sess_insurance_01", "auth0|user_deepti", "My bumper got hit yesterday.")
    print("Compiled Bedrock Prompt Payload:\n")
    print(prompt2)
