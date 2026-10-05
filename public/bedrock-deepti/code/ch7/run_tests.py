import multiprocessing
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key and starting page from environment variables
# with fallback values in case they're not set
NOVA_ACT_API_KEY = os.getenv("NOVA_ACT_API_KEY")
STARTING_PAGE = os.getenv("STARTING_PAGE", "https://don1s5671hvet.cloudfront.net")

# List of test suites to run
test_suites = [
    'qa-tests/01-homepage-load-test.json',
    'qa-tests/02-navigation-menu-test.json',
    'qa-tests/03-product-display-test.json',
    'qa-tests/04-search-functionality-test.json',
]


def run_test_wrapper(test_suite_path):
    """Wrapper function to run a single test suite in a separate process"""
    print(f"\n=== Process {os.getpid()} running test suite: {test_suite_path} ===\n")
    # (portion between the two screenshots is not readable — imports of the
    # per-suite runner live here in the original file)
    return run_single_test_suite(
        test_suite_path,
        starting_page=STARTING_PAGE,
        api_key=NOVA_ACT_API_KEY
    )


if __name__ == "__main__":
    # Check for command line arguments to run specific test
    if len(sys.argv) > 1:
        test_suite_path = sys.argv[1]
        print(f"Running single test suite from command line: {test_suite_path}")
        run_test_wrapper(test_suite_path)
        sys.exit(0)

    print(f"Running {len(test_suites)} test suites in parallel...")

    # Create a pool of worker processes
    with multiprocessing.Pool() as pool:
        # Map test suites to processes
        results = pool.map(run_test_wrapper, test_suites)

    # Check overall results
    passed = sum(1 for result in results if result)
    total = len(results)
