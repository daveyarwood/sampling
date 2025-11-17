import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

const SAMPLE_LENGTH_S = 10; // Length of each sample in seconds
const NUM_SAMPLES_PER_SOURCE = 4; // Number of samples to extract from each source audio

/**
 * Gets the duration of an audio file using soxi.
 * @param filePath The path to the audio file.
 * @returns A promise that resolves to the duration in seconds.
 */
const getAudioDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    exec(`soxi -D "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting duration for ${filePath}: ${stderr}`);
        return reject(error);
      }
      resolve(parseFloat(stdout.trim()));
    });
  });
};

/**
 * Processes an audio file, chopping it into multiple short samples.
 * @param inputFilePath The path to the input audio file.
 * @returns A promise that resolves to an array of relative paths (URLs) of the generated samples.
 */
export const processAudioFile = async (
  inputFilePath: string,
): Promise<string[]> => {
  const sampleUrls: string[] = [];
  const duration = await getAudioDuration(inputFilePath);

  if (duration < SAMPLE_LENGTH_S * NUM_SAMPLES_PER_SOURCE) {
    console.warn(
      `Audio file ${inputFilePath} is too short to extract ${NUM_SAMPLES_PER_SOURCE} samples of ${SAMPLE_LENGTH_S}s. Skipping.`,
    );
    return [];
  }

  const outputDir = path.join(__dirname, "..", "..", "public", "samples");
  await fs.mkdir(outputDir, { recursive: true });

  for (let i = 0; i < NUM_SAMPLES_PER_SOURCE; i++) {
    // Calculate a safe range for the start time
    const maxStartTime = duration - SAMPLE_LENGTH_S;
    const randomStartTime = Math.random() * maxStartTime;

    const outputFileName = `sample-${Date.now()}-${i}.wav`;
    const outputFilePath = path.join(outputDir, outputFileName);
    const relativeUrl = `/samples/${outputFileName}`;

    await new Promise<void>((resolve, reject) => {
      // sox --norm input.mp3 output.wav trim START_TIME DURATION
      const command = `sox --norm "${inputFilePath}" "${outputFilePath}" trim ${randomStartTime} ${SAMPLE_LENGTH_S}`;
      exec(command, (error, _stdout, stderr) => {
        if (error) {
          console.error(
            `Error processing audio file ${inputFilePath}: ${stderr}`,
          );
          return reject(error);
        }
        resolve();
      });
    });
    sampleUrls.push(relativeUrl);
  }

  // Clean up the original downloaded file
  await fs.unlink(inputFilePath);
  // Clean up the temporary directory
  await fs.rm(path.dirname(inputFilePath), { recursive: true, force: true });

  return sampleUrls;
};
