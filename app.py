import streamlit as st

st.title("Enterprise RAG Chatbot")

query = st.text_input("Ask question")

if query:
    st.write("Answer here")