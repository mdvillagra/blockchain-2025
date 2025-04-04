const fs = require("fs");
const path = require("path");

// Configuration
const INPUT_DIR = "./";  // Directory where input files are located
const OUTPUT_DIR = "./output";  // Directory for processed files
const PUBLIC_VARIABLES = ["c", "p"];  // Your variable names
const INPUT_PATTERN = /^public.*\.json$/i;  // Pattern to match input files

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Get all matching JSON files in the input directory
const inputFiles = fs.readdirSync(INPUT_DIR)
    .filter(file => INPUT_PATTERN.test(file) && !file.includes("_with_names"));

// Process each file
inputFiles.forEach(inputFile => {
    try {
        console.log(`Procesando ${inputFile}...`);
        
        // Read input file
        const publicValues = JSON.parse(fs.readFileSync(path.join(INPUT_DIR, inputFile), "utf8"));
        
        // Map variable names to values
        const publicWithNames = {};
        PUBLIC_VARIABLES.forEach((name, index) => {
            publicWithNames[name] = publicValues[index];
        });

        // Generate output filename
        const outputFile = path.join(
            OUTPUT_DIR,
            inputFile.replace(/\.json$/, "_result.json")
        );

        // Save the result
        fs.writeFileSync(outputFile, JSON.stringify(publicWithNames, null, 2));
        
        console.log(`Variables publicas mapeadas a: ${outputFile}`);
        console.log(publicWithNames);
        console.log("---");
    } catch (error) {
        console.error(`Error en ${inputFile}:`, error.message);
    }
});

console.log(`${inputFiles.length} archivos procesados`);