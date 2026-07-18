import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const storagePath = path.join(__dirname, 'responses.json');

app.use(cors());
app.use(express.json());

// API POST /submit endpoint
app.post('/submit', async (req, res) => {
  try {
    const { selectedFoods, sender, source } = req.body;

    if (!selectedFoods || !Array.isArray(selectedFoods) || selectedFoods.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một món ăn.' });
    }

    const record = {
      sender: typeof sender === 'string' ? sender.trim() : '',
      selectedFoods: selectedFoods.map(food => String(food)),
      timestamp: new Date().toISOString(),
      source: typeof source === 'string' ? source : 'birthday-food-picker'
    };

    let records = [];
    try {
      const data = await fs.readFile(storagePath, 'utf8');
      if (data && data.trim()) {
        records = JSON.parse(data);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error reading responses file:', err);
      }
    }

    records.push(record);

    await fs.writeFile(storagePath, JSON.stringify(records, null, 2), 'utf8');

    return res.json({ status: 'success', message: 'Tôi sẽ bao bạn những món đó (nếu có thể)' });
  } catch (error) {
    console.error('Error in /submit:', error);
    return res.status(500).json({ message: 'Không thể gửi dữ liệu lúc này. Vui lòng thử lại sau.' });
  }
});

// API GET /results endpoint
app.get('/results', async (req, res) => {
  try {
    let records = [];
    try {
      const data = await fs.readFile(storagePath, 'utf8');
      if (data && data.trim()) {
        records = JSON.parse(data);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error reading responses file:', err);
      }
    }

    const normalized = records.map(row => ({
      sender: row.sender || row.Sender || '',
      selectedFoods: row.selectedFoods || row.SelectedFoods || [],
      timestamp: row.timestamp || row.Timestamp || '',
      source: row.source || row.Source || 'birthday-food-picker'
    }));

    return res.json(normalized);
  } catch (error) {
    console.error('Error in /results:', error);
    return res.status(500).json({ message: 'Không thể tải dữ liệu lúc này.' });
  }
});


app.get('/', (req, res) => {
  res.redirect('/results.html');
});


app.get('/result.html', (req, res) => {
  res.redirect('/results.html');
});


app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
