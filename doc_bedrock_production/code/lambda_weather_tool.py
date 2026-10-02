import json

def lambda_handler(event, context):
    # The starter toolkit's default Lambda — created for you when you add a
    # target_type="lambda" without specifying your own function.
    #
    # The Gateway tells the Lambda WHICH tool was invoked through the
    # client context — not the event body:
    tool_name = context.client_context.get('bedrockAgentCoreToolName', 'unknown')

    if 'get_weather' in tool_name:
        return {
            'statusCode': 200,
            'body': json.dumps({
                'location': 'San Francisco',
                'temperature': '72°F',
                'conditions': 'Sunny'
            })
        }
    elif 'get_time' in tool_name:
        return {
            'statusCode': 200,
            'body': json.dumps({
                'timezone': 'PST',
                'time': '2:30 PM'
            })
        }
