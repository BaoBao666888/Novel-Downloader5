# Wikidich package - Architecture refactored
from .state import WikidichState
from .controller import WikidichController
from .view import WikidichTabView

__all__ = ['WikidichState', 'WikidichController', 'WikidichTabView']
