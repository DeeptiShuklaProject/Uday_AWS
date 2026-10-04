# tools/google.py — Google Calendar tool with user-federated OAuth

from bedrock_agentcore.identity.auth import requires_access_token
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from strands import tool

from google_credentials_provider import get_provider_name_from_ssm

SCOPES = ["https://www.googleapis.com/auth/calendar"]

GOOGLE_ACCESS_TOKEN = None


def on_auth_url(url: str):
    """Surface the Google consent URL back to the user."""
    response_queue.put(f"Authorization url: {url}")


@requires_access_token(
    provider_name=get_provider_name_from_ssm(),
    scopes=SCOPES,
    auth_flow="USER_FEDERATION",
    on_auth_url=on_auth_url,
    force_authentication=True,
)
def get_google_access_token(access_token=None):
    global GOOGLE_ACCESS_TOKEN
    GOOGLE_ACCESS_TOKEN = access_token
    return access_token


@tool
def create_calendar_event(summary: str, start_time: str, end_time: str,
                          description: str = ""):
    """Create a calendar event on behalf of the current user."""
    token = get_google_access_token()
    creds = Credentials(token=token)
    service = build("calendar", "v3", credentials=creds)
    event = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_time},
        "end": {"dateTime": end_time},
    }
    return service.events().insert(calendarId="primary", body=event).execute()


@tool
def get_calendar_events(max_results: int = 10):
    """Read the current user's upcoming agenda."""
    token = get_google_access_token()
    creds = Credentials(token=token)
    service = build("calendar", "v3", credentials=creds)
    return service.events().list(
        calendarId="primary", maxResults=max_results, singleEvents=True,
        orderBy="startTime",
    ).execute()
