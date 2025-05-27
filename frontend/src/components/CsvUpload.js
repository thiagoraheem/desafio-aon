import React, { useState } from 'react';
import axios from 'axios';

function CsvUpload({ onSuccess }) {
    const [file, setFile] = useState(null);

    const handleUpload = () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        axios.post('http://localhost:3001/api/users/upload', formData)
            .then(() => {
                setFile(null);
                onSuccess();
            });
    };

    return (
        <div className="mt-4">
            <h5>Importar CSV</h5>
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
            <button className="btn btn-secondary ms-2" onClick={handleUpload}>Enviar</button>
        </div>
    );
}

export default CsvUpload;
