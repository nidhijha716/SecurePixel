#include <iostream>
#include <fstream>
#include <string>
#include "bitmap_image.hpp"
using namespace std;

class SecureSteganographyTool
{
public:
  bitmap_image image;

  void loadImage(const string &filename)
  {
    image = bitmap_image(filename);
    if (!image)
    {
      throw runtime_error("Failed to load image. Please check the file path and ensure the file exists.");
    }
  }

  void embedData(const string &message, const string &outputFilename, int key)
  {
    // Normalize the key to within the range of the alphabet
    key = key % 26;

    string encryptedMessage = encryptMessage(message, key);
    encryptedMessage += "<END>"; // Append distinct end marker

    int height = image.height();
    int width = image.width();
    int bitIndex = 0;
    int charIndex = 0;
    int byteValue = encryptedMessage[charIndex];

    for (int i = 0; i < height; ++i)
    {
      for (int j = 0; j < width; ++j)
      {
        rgb_t colour;
        image.get_pixel(j, i, colour);

        // Embed into red, green, and blue channels
        if (charIndex < encryptedMessage.length())
        {
          colour.red = (colour.red & 0xFE) | ((byteValue >> (7 - bitIndex)) & 1);
          updateBitIndex(bitIndex, charIndex, encryptedMessage, byteValue);
        }

        if (charIndex < encryptedMessage.length())
        {
          colour.green = (colour.green & 0xFE) | ((byteValue >> (7 - bitIndex)) & 1);
          updateBitIndex(bitIndex, charIndex, encryptedMessage, byteValue);
        }

        if (charIndex < encryptedMessage.length())
        {
          colour.blue = (colour.blue & 0xFE) | ((byteValue >> (7 - bitIndex)) & 1);
          updateBitIndex(bitIndex, charIndex, encryptedMessage, byteValue);
        }

        image.set_pixel(j, i, colour);

        if (charIndex >= encryptedMessage.length())
        {
          image.save_image(outputFilename);
          cout << "Data successfully embedded and saved in: " << outputFilename << endl;
          return;
        }
      }
    }
    throw runtime_error("Message too large to embed in the given image.");
  }

  void retrieveData(int key)
  {
    // Normalize the key to within the range of the alphabet
    key = key % 26;

    int height = image.height();
    int width = image.width();
    int bitIndex = 0;
    int byteValue = 0;
    string extractedMessage;

    for (int i = 0; i < height; ++i)
    {
      for (int j = 0; j < width; ++j)
      {
        rgb_t colour;
        image.get_pixel(j, i, colour);

        // Retrieve from red, green, and blue channels
        extractLSB(colour.red, byteValue, bitIndex, extractedMessage);
        extractLSB(colour.green, byteValue, bitIndex, extractedMessage);
        extractLSB(colour.blue, byteValue, bitIndex, extractedMessage);

        if (extractedMessage.size() >= 5 &&
            extractedMessage.substr(extractedMessage.size() - 5) == "<END>")
        {
          extractedMessage = extractedMessage.substr(0, extractedMessage.size() - 5);
          cout << "Retrieved Message: " << decryptMessage(extractedMessage, key) << endl;
          return;
        }
      }
    }
    throw runtime_error("No valid message found in the image.");
  }

private:
  void updateBitIndex(int &bitIndex, int &charIndex, const string &message, int &byteValue)
  {
    bitIndex++;
    if (bitIndex == 8)
    {
      bitIndex = 0;
      charIndex++;
      if (charIndex < message.length())
      {
        byteValue = message[charIndex];
      }
    }
  }

  void extractLSB(int colorChannel, int &byteValue, int &bitIndex, string &message)
  {
    byteValue = (byteValue << 1) | (colorChannel & 1);
    bitIndex++;
    if (bitIndex == 8)
    {
      message += static_cast<char>(byteValue);
      bitIndex = 0;
      byteValue = 0;
    }
  }

  string encryptMessage(const string &message, int shift)
  {
    string encrypted = message;
    for (char &c : encrypted)
    {
      if (isalpha(c))
      {
        char base = islower(c) ? 'a' : 'A';
        c = (c - base + shift + 26) % 26 + base;
      }
    }
    return encrypted;
  }

  string decryptMessage(const string &message, int shift)
  {
    return encryptMessage(message, -shift);
  }
};

int main(int argc, char *argv[])
{
  SecureSteganographyTool tool;

  try
  {
    if (argc > 1)
    {
      string mode = argv[1];

      if (mode == "embed" && argc == 6)
      {
        string inputFile = argv[2];
        string message = argv[3];
        int key = stoi(argv[4]);
        string outputFile = argv[5];

        tool.loadImage(inputFile);
        tool.embedData(message, outputFile, key);
      }
      else if (mode == "retrieve" && argc == 4)
      {
        string inputFile = argv[2];
        int key = stoi(argv[3]);

        tool.loadImage(inputFile);
        tool.retrieveData(key);
      }
      else
      {
        cout << "Invalid arguments.\nUsage:\n";
        cout << "Embed: stegno embed <input.bmp> <message> <key> <output.bmp>\n";
        cout << "Retrieve: stegno retrieve <input.bmp> <key>\n";
      }
    }
    else
    {
      cout << "No command-line arguments provided. Please use embed or retrieve mode.\n";
    }
  }
  catch (const exception &e)
  {
    cout << "Error: " << e.what() << endl;
  }

  return 0;
}
