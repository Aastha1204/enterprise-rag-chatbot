from groq import Groq
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()

# Create client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def ask_gpt(question):

    response = client.chat.completions.create(

       model="llama-3.1-8b-instant",

        messages=[
            {
                "role": "user",
                "content": question
            }
        ]
    )

    return response.choices[0].message.content 

load_dotenv()

print(os.getenv("GROQ_API_KEY"))