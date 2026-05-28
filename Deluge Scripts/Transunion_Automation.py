import requests
from env_loader import get_env_value

api = get_env_value("ZOHO_API_KEY")
url = f"https://sandbox.zohoapis.in/crm/v7/functions/equifax_automation1/actions/execute?auth_type=apikey&zapikey={api}"


headers = {
    "Content-Type": "application/json"
}

payload = {
    "credit_score": {
        "record_id": "1303437000000751498",
        "credit_score": "742"
    },

    "personal_information": {
        "record_id": "1303437000000751498",

        "identification": [
            {
                "Credit Report Date": "05/23/2026"
            },
            {
                "Social Security Number": "XXX-XX-7107"
            },
            {
                "Date of Birth": "05/23/1955"
            },
            {
                "Name": "STEVEN SATURDAY SLAH SR"
            }
        ],

        "contact_information": [
            {
                "address": "6040 W BROADWAY AVE APT 23 MINNEAPOLIS, MN 55428-3278"
            },
            {
                "address": "6301 QUINWOOD LN N APT 322 MAPLE GROVE, MN 55369-5712"
            },
            {
                "address": "6050 W BROADWAY AVE APT 23 NEW HOPE, MN 55428-2866"
            }
        ]
    },

    "accounts": {
        "record_id": "1303437000000751498",

        "accounts": [
            {
                "account_name": "CAPITAL ONE AUTO",
                "address": "CB DISPUTES TEAM,P O BOX 259407 PLANO, TX 75025",
                "phone": "(800) 946-0332",
                "monthly_payment": "$0",
                "date_opened": "12/15/2017",
                "responsibility": "Individual Account",
                "account_type": "Installment Account",
                "loan_type": "AUTOMOBILE",
                "account_number": "123456",
                "balance": "$0",
                "date_updated": "05/08/2023",
                "payment_received": "$210",
                "last_payment_made": "05/08/2023",
                "high_balance": "$24930",
                "pay_status": "Paid, Closed; was Paid as agreed",
                "terms": "$0 per month, paid Monthly for 65 months",
                "date_closed": "05/08/2023",
                "remarks": "Account previously in dispute-now resolved. reported by credit grant; CLOSED"
            },

            {
                "account_name": "CREDIT ACCEPTANCE CORP",
                "address": "POB 5070 SOUTHFIELD, MI 48086-5070",
                "phone": "(800) 634-1506",
                "monthly_payment": "$0",
                "date_opened": "04/06/2020",
                "responsibility": "Individual Account",
                "account_type": "Installment Account",
                "loan_type": "AUTOMOBILE",
                "account_number": "789654",
                "balance": "$36037",
                "date_updated": "05/06/2026",
                "payment_received": "$0",
                "last_payment_made": "03/27/2023",
                "pay_status": ">Account 120 Days Past Due Date<",
                "terms": "$0 per month, paid Monthly for 72 months",
                "high_balance_(hist.)": "$29668",
                "estimated_month_and_year_this_item_will_be_removed": "06/2028"
            },

            {
                "account_name": "LVNV FUNDING LLC",
                "address": "C/O RESURGENT CAPITAL SERVICES,PO BOX 1269 GREENVILLE, SC 29603",
                "phone": "(877) 527-4484",
                "date_opened": "10/30/2024",
                "responsibility": "Individual Account",
                "account_type": "Open Account",
                "loan_type": "FACTORING COMPANY ACCOUNT",
                "account_number": "456987",
                "balance": "$854",
                "date_updated": "05/05/2026",
                "last_payment_made": "04/25/2026",
                "high_balance": "$1105",
                "original_creditor": "DESTINY FIRST ELECTRONIC BANK",
                "past_due": "$854",
                "pay_status": ">Collection<",
                "estimated_month_and_year_this_item_will_be_removed": "04/2031",
                "remarks": "Account information disputed by consumer (FCRA); >PLACED FOR COLLECTION<"
            }
        ]
    },

    "collection": {
        "record_id": "1303437000000751498",

        "collection_details": [
            {
                "collection_agency": "PORTFOLIO RECOVERY",
                "original_creditor_name": "SYNCHRONY BANK",
                "date_assigned": "05/10/2026",
                "original_amount_owed": "$313",
                "amount": "$313",
                "comment": "PLACED FOR COLLECTION",
                "status": "Open"
            },

            {
                "collection_agency": "LVNV FUNDING LLC",
                "original_creditor_name": "DESTINY FIRST ELECTRONIC BANK",
                "date_assigned": "04/25/2026",
                "original_amount_owed": "$1105",
                "amount": "$854",
                "comment": "Account information disputed by consumer",
                "status": "Open"
            }
        ]
    },

    "inquiry": {
        "record_id": "1303437000000751498",

        "hard_inquires": [
            {
                "company": "SYNCBEBAY",
                "date": "Aug 14, 2025",
                "address": "",
                "request_originator": ""
            },

            {
                "company": "CAPITAL ONE",
                "date": "Jul 16, 2025",
                "address": "",
                "request_originator": ""
            },

            {
                "company": "WEBBANKAVANT LLC",
                "date": "Jul 15, 2025",
                "address": "",
                "request_originator": ""
            }
        ],

        "soft_inquires": [
            {
                "company": "CREDIT KARMA, INC",
                "date": "May 22, 2026",
                "address": "CONS RPT",
                "request_originator": ""
            },

            {
                "company": "CAPITAL ONE NATIONAL ASSOC",
                "date": "May 21, 2026",
                "address": "Account Review Inquiry",
                "request_originator": ""
            }
        ]
    }
}

response = requests.post(
    url,
    headers=headers,
    json=payload
)

print("Status Code:", response.status_code)
print("Response:")
print(response.text)
