from fastapi import FastAPI, UploadFile, File
import pandas as pd
import mysql.connector
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
load_dotenv()
app = FastAPI()


origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database_config = {
    "host": os.getenv('HOST'),
    "username": os.getenv('NAME'),
    "password": os.getenv('PASSWORD'),
    "database": os.getenv('DATABASE'),
    "port": os.getenv('PORT'),
}
global table_name
table_name = None
global column_names
column_names = None

def create_table(df):
    global column_names
    column_data_types = [df[col].dtype for col in column_names]
    # Create the SQL query to create the table    
    create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ("
    for col_name, col_data_type in zip(column_names, column_data_types):
        if col_data_type == 'object':
            data_type = 'VARCHAR(255)'  
        elif col_data_type == 'int64':
            data_type = 'INT'
        elif col_data_type == 'float64':
            data_type = 'FLOAT'
        else:
            data_type = 'VARCHAR(255)'  # Default to VARCHAR

        create_table_query += f"{col_name} {data_type}, "

    create_table_query = create_table_query.rstrip(", ")  # Remove trailing comma and space
    create_table_query += ");"
    return create_table_query


@app.post("/upload/")
async def upload_csv(file: UploadFile = File(...)):
    try:
        connection = mysql.connector.connect(**database_config)
        cursor = connection.cursor()
    except Exception as e:
        print(e)
        return {"error": str(e)}     
    try:
        # Connect to MySQL database        
        
        # Read CSV data        
        df = pd.read_csv(file.file)
        global table_name
        table_name = file.filename.split('.')[0]

        # Extract column names from the DataFrame        
        global column_names
        column_names = df.columns.tolist()
        columns_string = ", ".join([f"`{column}`" for column in column_names])
        columns_string+=')'
        columns_string = '(' + columns_string
        # Create table if doesn't exists 
        create_table_query = create_table(df)        
        cursor.execute(create_table_query)    
        #Insert Values in table
        values =''
        for _, row in df.iterrows():
            values+=f"{tuple(row)}"
            values+=','
        values = values.rstrip(", ") 
        values+=';'        
        query = f"INSERT INTO {table_name} {columns_string} VALUES {values}"              
        cursor.execute(query)        
        connection.commit()        
        return {"message": "Data uploaded successfully."}

    except Exception as e:
        print(e)
        return {"error": str(e)}
    finally:
        cursor.close()
        connection.close()
        
    
@app.get("/getdata/")
async def get_data():
    try:
        # Connect to MySQL database
        connection = mysql.connector.connect(**database_config)
        cursor = connection.cursor()

        # Fetch data from the table    
        if not table_name:
            raise Exception('Invalid Table Name')
        query = f"SELECT * FROM {table_name}" 
        cursor.execute(query)
        data = cursor.fetchall()                  
        global column_names
        return {"data": data, "columns":column_names}

    except Exception as e:
        print(e)
        return {"error": str(e)}
    
    finally:        
        cursor.close()
        connection.close()
        

if __name__ == '__main__':
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)