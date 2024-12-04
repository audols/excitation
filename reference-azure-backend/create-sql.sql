DROP TABLE IF EXISTS templates, questions, forms, documents, citations, events;

CREATE TABLE dbo.templates (
  template_id INT IDENTITY(1,1) PRIMARY KEY,
  template_name TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE(),
  modified_at DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE dbo.questions (
  question_id INT IDENTITY(1,1) PRIMARY KEY,
  template_id INTEGER REFERENCES templates(template_id),
  prefix TEXT,
  text TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE(),
  modified_at DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE dbo.forms (
  form_id INT IDENTITY(1,1) PRIMARY KEY,
  template_id INTEGER REFERENCES templates(template_id),
  form_name TEXT NOT NULL,
  creator TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE(),
  modified_at DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE dbo.documents (
  document_id INT IDENTITY(1,1) PRIMARY KEY,
  form_id INTEGER REFERENCES forms(form_id),
  name TEXT,
  pdf_url TEXT NOT NULL,
  di_url TEXT,
  creator TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE(),
  modified_at DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE dbo.citations (
  citation_id VARCHAR(256) PRIMARY KEY,
  form_id INTEGER REFERENCES forms(form_id),
  question_id INTEGER REFERENCES questions(question_id),
  document_id INTEGER REFERENCES documents(document_id),
  excerpt TEXT NOT NULL,
  bounds JSON,
  review INTEGER NOT NULL DEFAULT 0,
  creator TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE(),
  modified_at DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE dbo.events (
  event_id INT IDENTITY(1,1) PRIMARY KEY,
  body JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETDATE()
);

INSERT INTO dbo.templates (template_name, creator)
VALUES
  ('Microsoft Fiscal', 'system');

INSERT INTO dbo.questions (template_id, prefix, text, creator)
VALUES
  (1, '1', 'What was the company''s revenue for the third quarter of Fiscal Year 2024?', 'system'),
  (1, '2', 'What are the earnings per share (EPS) for this quarter?', 'system'),
  (1, '3', 'How much money did Microsoft return to shareholders in the form of share repurchases?', 'system'),
  (1, '4', 'What are the total assets reported?', 'system'),
  (1, '5', 'Are there any ongoing legal proceedings?', 'system'),
  (1, '6', 'What is an excerpt that spans two pages?', 'system');

INSERT INTO dbo.forms (template_id, form_name, creator)
VALUES
  (1, 'FY24Q3', 'system');

INSERT INTO dbo.documents (form_id, name, pdf_url, di_url, creator) 
VALUES 
  (1, 'PressReleaseFY24Q3', 'https://excitation.blob.core.windows.net/documents/PressReleaseFY24Q3.pdf', 'https://excitation.blob.core.windows.net/documents/PressReleaseFY24Q3.pdf.json', 'system'),
  (1, 'Microsoft 10Q FY24Q3 1', 'https://excitation.blob.core.windows.net/documents/Microsoft 10Q FY24Q3 1.pdf', 'https://excitation.blob.core.windows.net/documents/Microsoft 10Q FY24Q3 1.pdf.json', 'system');

INSERT INTO dbo.citations (citation_id, form_id, question_id, document_id, excerpt, creator)
VALUES
  ('1-system-1732038032110', 1, 1, 1, 'Revenue was $61.9 billion and increased 17%', 'system'),
  ('1-system-1732038042614', 1, 1, 2, '61,858', 'system'),
  ('1-system-1732038059108', 1, 2, 1, '$2.94', 'system'),
  ('1-system-1732038077289', 1, 3, 1, 'Microsoft returned $8.4 billion to shareholders in the form of share repurchases and dividends in the third quarter of fiscal year 2024.', 'system'),
  ('1-system-1732038088500', 1, 4, 1, '$484,275', 'system'),
  ('1-system-1732038098469', 1, 4, 2, '484,275', 'system'),
  ('1-system-1732038112929', 1, 5, 1, 'claims against us that may result in adverse outcomes in legal disputes;', 'system'),
  ('1-system-1732038120838', 1, 5, 2, 'Microsoft Mobile Oy, a subsidiary of Microsoft, along with other handset manufacturers and network operators, is a defendant in 45 lawsuits filed in the Superior Court for the District of Columbia by individual plaintiffs who allege that radio emissions from cellular handsets caused their brain tumors and other adverse health effects.', 'system'),
  ('1-system-1732038136246', 1, 6, 1, '· laws and regulations relating to the handling of personal data that may impede the adoption of our services or result in increased costs, legal claims, fines, or reputational damage; · claims against us that may result in adverse outcomes in legal disputes;', 'system');
