import { useState } from "react";
import axios from "axios";
const currentTime = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function App() {

  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // SEND MESSAGE

  const sendMessage = async () => {

    if (!message) return;

    setLoading(true);

    try {

      const res = await fetch("http://127.0.0.1:8000/chat", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question: message
        }),
      });

      const data = await res.json();

      setChats((prev) => [
        ...prev,
        {
  question: message,
  answer: data.answer,
  source: data.source,
  page: data.page,
  time: currentTime()
}
      ]);

      setMessage("");

    } catch (error) {

      console.log(error);

    }

    setLoading(false);
  };

  // UPLOAD PDF

  const uploadPDF = async () => {

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData
      );

      alert(response.data.message);

      setUploadedFiles((prev) => [
        ...prev,
        file.name
      ]);

      setFile(null);

    } catch (error) {

      console.log(error);
    }
  };

  return (

    <div style={{
      background:"#0f172a",
      height:"100vh",
      display:"flex",
      color:"white",
      fontFamily:"Arial"
    }}>

      {/* Sidebar */}

      <div style={{
        width:"320px",
        background:"#111827",
        padding:"20px",
        borderRight:"1px solid #1f2937",
        display:"flex",
        flexDirection:"column"
      }}>

        <h1 style={{
          fontSize:"30px",
          fontWeight:"bold",
          marginBottom:"30px"
        }}>
          Enterprise AI 🚀
        </h1>

        {/* Upload */}

        <div>

          <div
  onDrop={async (e) => {

  e.preventDefault();

  const droppedFile = e.dataTransfer.files[0];

  if (!droppedFile) return;

  setFile(droppedFile);

  const formData = new FormData();

  formData.append("file", droppedFile);

  try {

    const response = await axios.post(
      "http://127.0.0.1:8000/upload",
      formData
    );

    alert(response.data.message);

    setUploadedFiles((prev) => [
      ...prev,
      droppedFile.name
    ]);

  } catch (error) {

    console.log(error);

    alert("Upload failed");

  }

}}
  style={{
    border:"2px dashed #2563eb",
    padding:"30px",
    borderRadius:"16px",
    textAlign:"center",
    marginBottom:"15px",
    background:"#1e293b",
    cursor:"pointer"
  }}
>

  <p style={{
    fontSize:"16px",
    marginBottom:"10px"
  }}>
    📂 Drag & Drop PDF Here
  </p>

  <input
    type="file"
    onChange={(e) => setFile(e.target.files[0])}
    style={{
      color:"white"
    }}
  />

</div>

          <button
            onClick={uploadPDF}
            style={{
              width:"100%",
              padding:"15px",
              background:"#2563eb",
              border:"none",
              color:"white",
              borderRadius:"12px",
              marginTop:"10px",
              cursor:"pointer",
              fontSize:"16px",
              fontWeight:"bold"
            }}
          >
            + Upload PDF
          </button>

        </div>

        {/* Uploaded Documents */}

        <div style={{marginTop:"40px"}}>

          <p style={{
            color:"#9ca3af",
            marginBottom:"15px"
          }}>
            Uploaded Documents
          </p>

          {
            uploadedFiles.length === 0 ? (

              <div style={{
                color:"#6b7280"
              }}>
                No PDFs uploaded yet.
              </div>

            ) : (

              uploadedFiles.map((doc, index) => (

                <div
                  key={index}
                  style={{
                    background:"#1f2937",
                    padding:"14px",
                    borderRadius:"10px",
                    marginBottom:"10px"
                  }}
                >
                  📄 {doc}
                </div>

              ))

            )
          }

        </div>

      </div>

      {/* Main Chat */}

      <div style={{
        flex:1,
        display:"flex",
        flexDirection:"column"
      }}>

        {/* Header */}

        <div style={{
          padding:"20px",
          borderBottom:"1px solid #1f2937",
          fontSize:"26px",
          fontWeight:"bold",
          textAlign:"center"
        }}>
          Enterprise Knowledge Assistant 🤖
        </div>

        {/* Messages */}

        <div style={{
          flex:1,
          padding:"30px",
          overflowY:"auto"
        }}>

          {/* Welcome Message */}

          <div style={{
            background:"#1e293b",
            padding:"20px",
            borderRadius:"16px",
            maxWidth:"700px",
            marginBottom:"20px"
          }}>
            👋 Hello! Ask me anything about uploaded company documents.
          </div>

          {/* Chat History */}

          <div
            style={{
              display:"flex",
              flexDirection:"column",
              gap:"20px"
            }}
          >

            {chats.map((chat, index) => (

              <div key={index}>

                {/* User Message */}

                <div
  style={{
    display:"flex",
    justifyContent:"flex-end"
  }}
>

  <div
    style={{
      background:"#2563eb",
      padding:"18px",
      borderRadius:"18px",
      marginBottom:"10px",
      maxWidth:"700px",
      width:"fit-content"
    }}
  >

    <div>
      {chat.question}
    </div>

    <div
      style={{
        fontSize:"12px",
        opacity:"0.7",
        marginTop:"8px",
        textAlign:"right"
      }}
    >
      {chat.time}
    </div>

  </div>

</div>

             {/* AI Message */}

<div
  style={{
    display:"flex",
    justifyContent:"flex-start"
  }}
>

  <div
    style={{
      background:"#1f2937",
      padding:"18px",
      borderRadius:"18px",
      maxWidth:"700px",
      lineHeight:"1.6"
    }}
  >

    <div>
      🤖 {chat.answer}
    </div>

    <div
      style={{
        fontSize:"12px",
        opacity:"0.7",
        marginTop:"8px"
      }}
    >
      {chat.time}
    </div>
    <div
      style={{
        marginTop:"10px",
        color:"#9ca3af",
        fontSize:"14px"
      }}
    >
      📄 Source: {chat.source} | Page {chat.page}
    </div>

  </div>

</div> 
</div>
            ))}  

            {/* Loading */}

{
  loading && (

    <div style={{
      background:"#1f2937",
      padding:"18px",
      borderRadius:"16px",
      maxWidth:"250px"
    }}>

      <div
        style={{
          display:"flex",
          gap:"6px",
          alignItems:"center"
        }}
      >
        <span>🤖 Typing</span>

        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>

      </div>

    </div>

  )
}
          </div>

        </div>
          
        {/* Input */}

        <div style={{
          padding:"20px",
          borderTop:"1px solid #1f2937",
          display:"flex",
          gap:"15px"
        }}>

          <input
            value={message}
            onChange={(e)=>setMessage(e.target.value)}
            placeholder="Ask your question..."
            style={{
              flex:1,
              padding:"16px",
              borderRadius:"12px",
              border:"none",
              background:"#1e293b",
              color:"white",
              fontSize:"16px",
              outline:"none"
            }}
          />

          <button
            onClick={sendMessage}
            style={{
              background:"#2563eb",
              border:"none",
              color:"white",
              padding:"16px 30px",
              borderRadius:"12px",
              fontSize:"16px",
              cursor:"pointer",
              fontWeight:"bold"
            }}
          >
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

