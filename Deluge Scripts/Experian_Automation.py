import requests
from env_loader import get_env_value

api = get_env_value("ZOHO_API_KEY")
url = f"https://sandbox.zohoapis.in/crm/v7/functions/automation/actions/execute?auth_type=apikey&zapikey={api}"

headers = {
    "Content-Type": "application/json"
}

payload = {
    "credit_score": {
        "record_id": "1303437000000751498",
        "credit_score": "742"
    },
    "personal_Information": {
        "record_id": "1303437000000751498",
        "contact_information": {
            "address": [
                {
                    "full_address": "212 E WISHART ST PHILADELPHIA, PA 19149",
                    "street": "212 E WISHART ST",
                    "state": "PHILADELPHIA, PA 19149"
                }
            ]
        },
        "identification": [
            {"Name": "Deivy Aponte"},
            {"Date of Birth": "Jan 12, 1985"}
        ]
    },
    "accounts": {
        "open_accounts": [
            {
                "record_id": "1303437000000751498",
                "account_name": "CAPITAL ONE",
                "account_type": "Credit Card",
                "account_number": "****4521",
                "account_status": "Open",
                "date_opened": "Mar 29, 2024",
                "balance": "$1,240",
                "high_credit": "$5,000",
                "block_type": "late",
                "open_closed": "Open",
                "count_late_payment": 2,
                "past_due": True,
                "past_due_amount": "$120"
            }
        ],
        "closed_accounts": []
    },
    "collection": {
        "record_id": "1303437000000751498",
        "collection_details": [
            {
                "collection_agency": "MIDLAND CREDIT",
                "original_creditor_name": "SYNCHRONY BANK",
                "date_assigned": "Feb 14, 2026",
                "original_amount_owed": "$890",
                "amount": "$540",
                "comment": "Account in dispute",
                "status": "Open"
            }
        ]
    },
    "inquiry": {
        "record_id": "1303437000000751498",
        "hard_inquires": [
            {"company": "AXIS BANK", "date": "May 10, 2026"}
        ],
        "soft_inquires": []
    }
}

response = requests.post(url, headers=headers, json=payload)

print("Status Code:", response.status_code)
print("Response:", response.text)
