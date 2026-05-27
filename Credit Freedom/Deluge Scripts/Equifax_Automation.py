import requests
from env_loader import get_env_value

api = get_env_value("ZOHO_API_KEY")
url = f"https://sandbox.zohoapis.in/crm/v7/functions/experian_automation1/actions/execute?auth_type=apikey&zapikey={api}"

headers = {
    "Content-Type": "application/json"
}

payload = {
    "record_id": "1303437000000751498",
    "type": "inquiry",
    "date_of_report": "May 25, 2026",

    "hard_inquires": [
        {
            "date": "Dec 03, 2025",
            "company": "MEMBERS CREDIT UNION",
            "address": "MEMBERS CREDIT UNION, 2098 Frontis Plaza Blvd, Winston Salem, NC 27103-5613",
            "request_originator": ""
        },
        {
            "date": "Feb 22, 2025",
            "company": "US BANCORP",
            "address": "US BANCORP, 4325 17TH AVE SOUTHWEST, FARGO, ND 58125",
            "request_originator": ""
        }
    ],

    "soft_inquires": [
        {
            "date": "May 22, 2026",
            "company": "CREDIT KARMA, INC",
            "address": "CONS RPT",
            "request_originator": ""
        },
        {
            "date": "May 23, 2026",
            "company": "CREDIT KARMA, INC",
            "address": "CONS RPT",
            "request_originator": ""
        }
    ]
}

response = requests.post(url, headers=headers, json=payload)

print("Status Code:", response.status_code)
print("Response:")
print(response.text)
