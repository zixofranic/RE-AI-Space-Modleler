// Global state
let designPreferences = {};
let uploadedImages = [];
let stagedResults = []; // Store staged images for download

// DOM Elements
const questionnaireSection = document.getElementById('questionnaire-section');
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');
const questionnaireForm = document.getElementById('questionnaire-form');
const imageInput = document.getElementById('image-input');
const uploadArea = document.getElementById('upload-area');
const imagePreview = document.getElementById('image-preview');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('results-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Questionnaire form submission
    questionnaireForm.addEventListener('submit', handleQuestionnaireSubmit);

    // Image upload
    imageInput.addEventListener('change', handleImageSelect);
    uploadArea.addEventListener('click', () => imageInput.click());

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Generate button
    generateBtn.addEventListener('click', handleGenerate);
}

function handleQuestionnaireSubmit(e) {
    e.preventDefault();

    // Collect form data
    const formData = new FormData(questionnaireForm);
    designPreferences = {};

    for (let [key, value] of formData.entries()) {
        designPreferences[key] = value;
    }

    console.log('Design Preferences:', designPreferences);

    // Show upload section
    showSection('upload');
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
    );

    processFiles(files);
}

function processFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const imageData = {
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name
                };

                uploadedImages.push(imageData);
                renderImagePreview();
                updateGenerateButton();
            };

            reader.readAsDataURL(file);
        }
    });
}

function renderImagePreview() {
    imagePreview.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';

        previewItem.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <button class="remove-btn" onclick="removeImage(${index})">×</button>
        `;

        imagePreview.appendChild(previewItem);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreview();
    updateGenerateButton();
}

function updateGenerateButton() {
    generateBtn.disabled = uploadedImages.length === 0;
}

async function handleGenerate() {
    if (uploadedImages.length === 0) {
        alert('Please upload at least one image');
        return;
    }

    showSection('results');
    loading.style.display = 'block';
    resultsContainer.classList.remove('visible');

    try {
        // Prepare data for API
        const requestData = {
            preferences: designPreferences,
            images: uploadedImages.map(img => ({
                name: img.name,
                data: img.dataUrl
            }))
        };

        // Call backend API
        const response = await fetch('/api/generate-staging', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();

        // Display results
        displayResults(results);

    } catch (error) {
        console.error('Error generating staging:', error);
        loading.innerHTML = `
            <div class="alert alert-error">
                <strong>Error:</strong> ${error.message}<br>
                <small>Please make sure the backend server is running on port 3000</small>
            </div>
            <button class="btn-secondary" onclick="goBack()">Go Back</button>
        `;
    }
}

function displayResults(results) {
    loading.style.display = 'none';
    resultsContainer.classList.add('visible');
    resultsContainer.innerHTML = '';

    // Store results globally for downloads
    stagedResults = results;

    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const stagedImageUrl = result.imageUrl || uploadedImages[index].dataUrl;

        resultItem.innerHTML = `
            <div class="image-container">
                <img src="${stagedImageUrl}" alt="Staged ${uploadedImages[index].name}" onclick="openImageViewer(${index})" style="cursor: pointer;">
                <div class="image-overlay">Click to view full size</div>
            </div>
            <div class="result-content">
                <h3>${result.roomType || 'Room ' + (index + 1)}</h3>
                <p><strong>Design Description:</strong></p>
                <p>${result.description}</p>
                <p><strong>Furniture & Decor:</strong></p>
                <p>${result.suggestions}</p>
                <button class="download-btn" onclick="downloadImage(${index})">
                    Download Design
                </button>
            </div>
        `;

        resultsContainer.appendChild(resultItem);
    });
}

function downloadImage(index) {
    const link = document.createElement('a');
    // Download the STAGED image, not the original
    const stagedImageUrl = stagedResults[index]?.imageUrl || uploadedImages[index].dataUrl;
    link.href = stagedImageUrl;
    link.download = `staged-${uploadedImages[index].name}`;
    link.click();
}

// Image viewer/lightbox functionality
function openImageViewer(index) {
    const stagedImageUrl = stagedResults[index]?.imageUrl || uploadedImages[index].dataUrl;
    const roomType = stagedResults[index]?.roomType || `Room ${index + 1}`;

    // Create lightbox overlay
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
            <div class="lightbox-header">
                <h3>${roomType}</h3>
                <button class="lightbox-download" onclick="downloadImage(${index})">
                    Download Image
                </button>
            </div>
            <img src="${stagedImageUrl}" alt="${roomType}">
            <div class="lightbox-nav">
                ${index > 0 ? `<button class="lightbox-prev" onclick="navigateLightbox(${index - 1})">&larr; Previous</button>` : '<div></div>'}
                <span>${index + 1} / ${stagedResults.length}</span>
                ${index < stagedResults.length - 1 ? `<button class="lightbox-next" onclick="navigateLightbox(${index + 1})">Next &rarr;</button>` : '<div></div>'}
            </div>
        </div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

function closeLightbox() {
    const lightbox = document.querySelector('.lightbox');
    if (lightbox) {
        lightbox.remove();
        document.body.style.overflow = 'auto';
    }
}

function navigateLightbox(index) {
    closeLightbox();
    openImageViewer(index);
}

function showSection(section) {
    questionnaireSection.classList.remove('active');
    uploadSection.classList.remove('active');
    resultsSection.classList.remove('active');

    if (section === 'questionnaire') {
        questionnaireSection.classList.add('active');
    } else if (section === 'upload') {
        uploadSection.classList.add('active');
    } else if (section === 'results') {
        resultsSection.classList.add('active');
    }
}

function goBack() {
    if (resultsSection.classList.contains('active')) {
        showSection('upload');
    } else if (uploadSection.classList.contains('active')) {
        showSection('questionnaire');
    }
}

function startOver() {
    // Reset state
    designPreferences = {};
    uploadedImages = [];
    stagedResults = [];

    // Reset form
    questionnaireForm.reset();
    imagePreview.innerHTML = '';
    resultsContainer.innerHTML = '';

    // Show first section
    showSection('questionnaire');
}

// Download all functionality
document.getElementById('download-all-btn')?.addEventListener('click', () => {
    uploadedImages.forEach((image, index) => {
        setTimeout(() => {
            downloadImage(index);
        }, index * 500); // Stagger downloads
    });
});
