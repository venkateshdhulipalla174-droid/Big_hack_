from time import perf_counter


def measure(operation):
    start = perf_counter()
    result = operation()
    return result, perf_counter() - start
