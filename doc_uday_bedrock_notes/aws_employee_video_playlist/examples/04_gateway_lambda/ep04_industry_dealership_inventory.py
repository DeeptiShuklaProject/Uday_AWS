import json

# =====================================================================
# INDUSTRY STUDY: Car Dealership Vehicle Search and Booking
# File: ep04_industry_dealership_inventory.py (Gateway Tool Simulator)
# =====================================================================

VEHICLE_INVENTORY = [
    {"vin": "VIN_12345", "make": "Tesla", "model": "Model Y", "year": 2023, "price": 42000.0, "status": "Available"},
    {"vin": "VIN_67890", "make": "Ford", "model": "F-150", "year": 2022, "price": 38500.0, "status": "Reserved"},
    {"vin": "VIN_11223", "make": "Toyota", "model": "RAV4", "year": 2024, "price": 32000.0, "status": "Available"}
]

def search_inventory(make: str = None) -> dict:
    results = []
    for car in VEHICLE_INVENTORY:
        if make is None or car["make"].lower() == make.lower():
            results.append(car)
    return {"status": "success", "results": results}

def reserve_vehicle(vin: str) -> dict:
    for car in VEHICLE_INVENTORY:
        if car["vin"] == vin:
            if car["status"] == "Reserved":
                return {"status": "error", "message": f"Vehicle with VIN {vin} is already reserved."}
            car["status"] = "Reserved"
            return {"status": "success", "message": f"Vehicle {car['make']} {car['model']} reserved successfully."}
    return {"status": "error", "message": f"Vehicle with VIN {vin} not found."}

def lambda_handler(event, context):
    method = event.get("method", "")
    params = event.get("params", {})
    
    if method == "tools/list":
        return {
            "statusCode": 200,
            "body": {
                "tools": [
                    {
                        "name": "search_inventory",
                        "description": "Fetch list of available cars optionally filtered by manufacturer name (e.g. Toyota, Tesla).",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "make": {"type": "string"}
                            }
                        }
                    },
                    {
                        "name": "reserve_vehicle",
                        "description": "Mark a vehicle as reserved to hold it for a customer by providing its VIN number.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "vin": {"type": "string"}
                            },
                            "required": ["vin"]
                        }
                    }
                ]
            }
        }
        
    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name == "search_inventory":
            make = arguments.get("make")
            res = search_inventory(make)
            return {
                "statusCode": 200,
                "body": {
                    "content": [{"type": "text", "text": json.dumps(res)}]
                }
            }
            
        elif tool_name == "reserve_vehicle":
            vin = arguments.get("vin")
            res = reserve_vehicle(vin)
            return {
                "statusCode": 200,
                "body": {
                    "content": [{"type": "text", "text": json.dumps(res)}]
                }
            }
            
        return {
            "statusCode": 404,
            "body": {"error": f"Unknown tool: {tool_name}"}
        }
        
    return {
        "statusCode": 400,
        "body": {"error": "Invalid Gateway payload method format."}
    }
