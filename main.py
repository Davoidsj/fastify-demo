import requests

url = 'https://fastify-demo-bqj7.onrender.com/admin/resources/Movies/records/2c2827bb-fbce-408c-a11f-65e4c1ae0452/show'

response = requests.get(url)

if response.status_code == 200:
    try:
        # Try parsing the response as JSON
        movie_data = response.json()
        print('Movie Data:', movie_data)
    except ValueError:  # Catch errors if the response is not JSON
        print('Response is not in JSON format.')
        print(response.text)  # Print raw response to inspect the content
else:
    print(f'Error: {response.status_code}, {response.text}')
