CXX = g++
CXXFLAGS = -std=c++11 -Wall -Wextra -O2
TARGET = url_shortener
SRCDIR = src
OBJDIR = obj
DATADIR = data

# Source files
SOURCES = $(wildcard $(SRCDIR)/*.cpp)
OBJECTS = $(SOURCES:$(SRCDIR)/%.cpp=$(OBJDIR)/%.o)

# Default target
all: $(TARGET)

# Create directories
$(OBJDIR):
	mkdir -p $(OBJDIR)

$(DATADIR):
	mkdir -p $(DATADIR)

# Build target
$(TARGET): $(OBJECTS) | $(DATADIR)
	$(CXX) $(OBJECTS) -o $(TARGET)
	@echo "Build complete! Run ./$(TARGET) to start the application."

# Compile object files
$(OBJDIR)/%.o: $(SRCDIR)/%.cpp | $(OBJDIR)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Clean build files
clean:
	rm -rf $(OBJDIR) $(TARGET)
	@echo "Clean complete!"

# Run the application
run: $(TARGET)
	./$(TARGET)

# Install dependencies (if needed)
install:
	@echo "No external dependencies required for this project."

# Help
help:
	@echo "Available targets:"
	@echo "  all     - Build the URL shortener application"
	@echo "  clean   - Remove build files"
	@echo "  run     - Build and run the application"
	@echo "  install - Install dependencies (none required)"
	@echo "  help    - Show this help message"

.PHONY: all clean run install help 